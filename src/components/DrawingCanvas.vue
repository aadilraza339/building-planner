<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps({
  activeTool: {
    type: String,
    required: true
  },
  shapes: {
    type: Array,
    required: true
  },
  selectedShape: {
    type: Object,
    default: null
  },
  showAnnotations: {
    type: Boolean,
    default: true
  },
  activeColor: {
    type: String,
    default: '#333'
  },
  activeFillColor: {
    type: String,
    default: 'transparent'
  }
});

const emit = defineEmits(['shape-added', 'shape-selected', 'shape-updated']);

const canvas = ref(null);
const isDrawing = ref(false);
const startPoint = ref({ x: 0, y: 0 });
const endPoint = ref({ x: 0, y: 0 });
const dragOffset = ref({ x: 0, y: 0 });
const resizing = ref(false);
const resizeHandle = ref('');
const canvasRect = ref(null);

// Get the 2D rendering context
let ctx = null;

// Draw all shapes on the canvas
function drawShapes() {
  if (!ctx || !canvas.value) return;
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  
  // Draw all shapes
  for (const shape of props.shapes) {
    drawShape(shape, shape.id === props.selectedShape?.id);
  }
}

// Initialize the canvas
onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvasRect.value = canvas.value.getBoundingClientRect();
    
    // Add mouse event listeners
    canvas.value.addEventListener('mousedown', handleMouseDown);
    canvas.value.addEventListener('mousemove', handleMouseMove);
    canvas.value.addEventListener('mouseup', handleMouseUp);
    canvas.value.addEventListener('mouseleave', handleMouseUp);
  }
});

// Resize the canvas to fill the container
const resizeCanvas = () => {
  if (canvas.value) {
    const container = canvas.value.parentElement;
    canvas.value.width = container.clientWidth;
    canvas.value.height = container.clientHeight;
    drawShapes();
  }
};

// Watch for changes in shapes or selectedShape and redraw
watch(() => [...props.shapes], drawShapes, { deep: true });
watch(() => props.selectedShape, drawShapes);
watch(() => props.showAnnotations, drawShapes);

// Calculate distance between two points
const distance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Handle mouse down event
const handleMouseDown = (e) => {
  if (!ctx) return;
  
  // Get mouse position relative to canvas
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // First, reset any ongoing operations
  resizeHandle.value = '';
  
  if (props.activeTool === 'select') {
    // Check if we're clicking on a resize handle of the selected shape
    if (props.selectedShape) {
      // Force redraw to ensure handles are properly displayed
      drawShapes();
      
      const handle = getResizeHandle(x, y, props.selectedShape);
      if (handle) {
        resizing.value = true;
        resizeHandle.value = handle;
        startPoint.value = { x, y };
        return;
      }
    }
    
    // Check if we're clicking on a shape
    const clickedShape = props.shapes.find(shape => isPointInShape(x, y, shape));
    
    if (clickedShape) {
      emit('shape-selected', clickedShape);
      
      // Start drag operation
      isDrawing.value = true;
      startPoint.value = { x, y };
      dragOffset.value = {
        x: x - clickedShape.x,
        y: y - clickedShape.y
      };
    } else {
      // Deselect if clicking on empty area
      emit('shape-selected', null);
    }
  } else {
    // Start drawing a new shape
    isDrawing.value = true;
    startPoint.value = { x, y };
    endPoint.value = { x, y };
  }
};

// Handle mouse move event
const handleMouseMove = (e) => {
  if (!ctx) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Always process resizing even if isDrawing.value is false
  if (resizing.value && props.selectedShape) {
    // Resize operation takes priority
    const shape = { ...props.selectedShape };
    
    if (shape.type === 'line') {
      // Handle line resizing
      switch (resizeHandle.value) {
        case 'start':
          shape.startX = x;
          shape.startY = y;
          break;
        case 'end':
          shape.endX = x;
          shape.endY = y;
          break;
      }
      
      // Recalculate x, y, width, height based on start and end points
      const minX = Math.min(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxX = Math.max(shape.startX, shape.endX);
      const maxY = Math.max(shape.startY, shape.endY);
      
      shape.x = minX;
      shape.y = minY;
      shape.width = maxX - minX;
      shape.height = maxY - minY;
    } else {
      // Handle rectangle and circle resizing
      switch (resizeHandle.value) {
        case 'top-left':
          shape.width += (shape.x - x);
          shape.height += (shape.y - y);
          shape.x = x;
          shape.y = y;
          break;
        case 'top-right':
          shape.width = x - shape.x;
          shape.height += (shape.y - y);
          shape.y = y;
          break;
        case 'bottom-left':
          shape.width += (shape.x - x);
          shape.height = y - shape.y;
          shape.x = x;
          break;
        case 'bottom-right':
          shape.width = x - shape.x;
          shape.height = y - shape.y;
          break;
      }
      
      // Ensure minimum dimensions
      if (shape.width < 10) shape.width = 10;
      if (shape.height < 10) shape.height = 10;
    }
    
    emit('shape-updated', shape);
    return;
  }
  
  if (!isDrawing.value) return;
  
  if (props.activeTool === 'select' && props.selectedShape) {
    // We already handled resizing above, so we only need to handle movement here
    if (!resizing.value) {
      // Move the selected shape
      const updatedShape = { ...props.selectedShape };
      updatedShape.x = x - dragOffset.value.x;
      updatedShape.y = y - dragOffset.value.y;
      emit('shape-updated', updatedShape);
    }
  } else {
    // Update preview of the shape being drawn
    endPoint.value = { x, y };
    drawShapes();
    drawPreview();
  }
};

// Handle mouse up event
const handleMouseUp = () => {
  if (isDrawing.value && !resizing.value && props.activeTool !== 'select') {
    // Add new shape
    const newShape = createShape();
    if (newShape) {
      emit('shape-added', newShape);
    }
  }
  
  // Reset states
  isDrawing.value = false;
  resizing.value = false;
};

// Create a new shape based on the active tool
const createShape = () => {
  const x = Math.min(startPoint.value.x, endPoint.value.x);
  const y = Math.min(startPoint.value.y, endPoint.value.y);
  const width = Math.abs(endPoint.value.x - startPoint.value.x);
  const height = Math.abs(endPoint.value.y - startPoint.value.y);
  
  // Don't create tiny shapes
  if (width < 5 && height < 5) return null;
  
  return {
    id: uuidv4(),
    type: props.activeTool,
    x,
    y,
    width,
    height,
    startX: startPoint.value.x,
    startY: startPoint.value.y,
    endX: endPoint.value.x,
    endY: endPoint.value.y,
    color: props.activeColor || '#333',
    fillColor: props.activeFillColor || 'transparent'
  };
};

// Check if a point is inside a shape
const isPointInShape = (x, y, shape) => {
  switch (shape.type) {
    case 'rectangle':
      return x >= shape.x && x <= shape.x + shape.width && 
             y >= shape.y && y <= shape.y + shape.height;
    
    case 'circle':
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.max(shape.width, shape.height) / 2;
      return distance({ x, y }, { x: centerX, y: centerY }) <= radius;
    
    case 'line':
      // For lines, check if point is close to the line
      const lineDistance = pointToLineDistance(
        { x, y },
        { x: shape.startX, y: shape.startY },
        { x: shape.endX, y: shape.endY }
      );
      return lineDistance < 5; // 5px threshold for selection
  }
  return false;
};

// Calculate distance from point to line
const pointToLineDistance = (point, lineStart, lineEnd) => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// Get resize handle at position
const getResizeHandle = (x, y, shape) => {
  // Use a slightly larger detection area for handles to make them easier to grab
  const handleSize = 10;
  let handles = {};
  
  // Different handle positions based on shape type
  if (shape.type === 'line') {
    handles = {
      'start': { x: shape.startX, y: shape.startY },
      'end': { x: shape.endX, y: shape.endY }
    };
  } else {
    handles = {
      'top-left': { x: shape.x, y: shape.y },
      'top-right': { x: shape.x + shape.width, y: shape.y },
      'bottom-left': { x: shape.x, y: shape.y + shape.height },
      'bottom-right': { x: shape.x + shape.width, y: shape.y + shape.height }
    };
  }
  
  // Check each handle with a bit of tolerance to make selection easier
  for (const [handle, pos] of Object.entries(handles)) {
    if (
      x >= pos.x - handleSize && x <= pos.x + handleSize &&
      y >= pos.y - handleSize && y <= pos.y + handleSize
    ) {
      return handle;
    }
  }
  
  return '';
};



// Draw a shape on the canvas
const drawShape = (shape, isSelected = false) => {
  if (!ctx) return;
  
  // Set styles based on selection state
  if (isSelected) {
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = shape.color || '#333';
    ctx.lineWidth = 1;
  }
  
  // Set fill color if provided
  ctx.fillStyle = shape.fillColor || 'transparent';
  
  // Draw the shape based on its type
  switch (shape.type) {
    case 'rectangle':
      ctx.beginPath();
      ctx.rect(shape.x, shape.y, shape.width, shape.height);
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'circle':
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.max(shape.width, shape.height) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'line':
      ctx.beginPath();
      ctx.moveTo(shape.startX, shape.startY);
      ctx.lineTo(shape.endX, shape.endY);
      ctx.stroke();
      break;
  }
  
  // Draw annotations if enabled
  if (props.showAnnotations) {
    drawAnnotations(shape);
  }
  
  // Draw resize handles if selected
  if (isSelected) {
    drawResizeHandles(shape);
  }
};

// Draw shape annotations (dimensions)
const drawAnnotations = (shape) => {
  if (!ctx) return;
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#555';
  
  switch (shape.type) {
    case 'rectangle':
      // Width annotation
      const widthText = `${Math.round(shape.width)}px`;
      ctx.fillText(widthText, shape.x + shape.width / 2 - 15, shape.y - 5);
      
      // Height annotation
      const heightText = `${Math.round(shape.height)}px`;
      ctx.fillText(heightText, shape.x - 25, shape.y + shape.height / 2);
      break;
      
    case 'circle':
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.max(shape.width, shape.height) / 2;
      
      // Radius annotation
      const radiusText = `r=${Math.round(radius)}px`;
      ctx.fillText(radiusText, centerX - 20, centerY - radius - 5);
      break;
      
    case 'line':
      // Length annotation
      const length = Math.round(distance(
        { x: shape.startX, y: shape.startY },
        { x: shape.endX, y: shape.endY }
      ));
      const midX = (shape.startX + shape.endX) / 2;
      const midY = (shape.startY + shape.endY) / 2;
      
      const lengthText = `${length}px`;
      ctx.fillText(lengthText, midX + 5, midY - 5);
      break;
  }
};

// Draw resize handles for selected shape
const drawResizeHandles = (shape) => {
  if (!ctx) return;
  
  let handles = [];
  
  // Handle different shape types
  if (shape.type === 'line') {
    // For lines, put handles at start and end points
    handles = [
      { x: shape.startX, y: shape.startY }, // start
      { x: shape.endX, y: shape.endY } // end
    ];
  } else {
    // For rectangles and circles
    handles = [
      { x: shape.x, y: shape.y }, // top-left
      { x: shape.x + shape.width, y: shape.y }, // top-right
      { x: shape.x, y: shape.y + shape.height }, // bottom-left
      { x: shape.x + shape.width, y: shape.y + shape.height } // bottom-right
    ];
  }
  
  ctx.fillStyle = '#007bff';
  ctx.strokeStyle = '#ffffff';
  
  for (const handle of handles) {
    ctx.beginPath();
    ctx.rect(handle.x - 4, handle.y - 4, 8, 8);
    ctx.fill();
    ctx.stroke(); // Add white border for better visibility
  }
};

// Draw preview while drawing
const drawPreview = () => {
  if (!isDrawing.value || !ctx || props.activeTool === 'select') return;
  
  // Use dashed line for preview
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 1;
  
  switch (props.activeTool) {
    case 'rectangle':
      const x = Math.min(startPoint.value.x, endPoint.value.x);
      const y = Math.min(startPoint.value.y, endPoint.value.y);
      const width = Math.abs(endPoint.value.x - startPoint.value.x);
      const height = Math.abs(endPoint.value.y - startPoint.value.y);
      
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.stroke();
      break;
      
    case 'circle':
      const centerX = (startPoint.value.x + endPoint.value.x) / 2;
      const centerY = (startPoint.value.y + endPoint.value.y) / 2;
      const radius = Math.max(
        Math.abs(endPoint.value.x - startPoint.value.x),
        Math.abs(endPoint.value.y - startPoint.value.y)
      ) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      break;
      
    case 'line':
      ctx.beginPath();
      ctx.moveTo(startPoint.value.x, startPoint.value.y);
      ctx.lineTo(endPoint.value.x, endPoint.value.y);
      ctx.stroke();
      break;
  }
  
  // Reset line style
  ctx.setLineDash([]);
};

// Get cursor style based on resizing state
const getCursorStyle = computed(() => {
  if (resizing.value) {
    switch (resizeHandle.value) {
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize';
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize';
    }
  }
  
  return props.activeTool === 'select' ? 'default' : 'crosshair';
});
</script>

<template>
  <div class="canvas-container">
    <canvas
      ref="canvas"
      :class="{ 'cursor-crosshair': activeTool !== 'select' }"
      :style="{ cursor: getCursorStyle }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    ></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  flex: 1;
  background-color: white;
  border: 1px solid #ddd;
  overflow: hidden;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.cursor-crosshair {
  cursor: crosshair;
}
</style>
