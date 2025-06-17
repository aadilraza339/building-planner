<script setup>
const props = defineProps({
  activeTool: {
    type: String,
    required: true
  },
  selectedShape: {
    type: Object,
    default: null
  },
  activeColor: {
    type: String,
    default: '#333333'
  },
  activeFillColor: {
    type: String,
    default: 'transparent'
  }
});

// Format the name of the active tool
const getToolName = (toolId) => {
  const toolNames = {
    select: 'Select',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle'
  };
  
  return toolNames[toolId] || toolId;
};

// Format color for display, including handling transparent
const formatColor = (color) => {
  return color === 'transparent' ? 'None' : color;
};

// Get dimensions info of the selected shape
const getDimensionsInfo = () => {
  if (!props.selectedShape) return '';
  
  const shape = props.selectedShape;
  
  switch (shape.type) {
    case 'rectangle':
      return `Width: ${Math.round(shape.width)}px, Height: ${Math.round(shape.height)}px`;
    
    case 'circle':
      const radius = Math.max(shape.width, shape.height) / 2;
      return `Radius: ${Math.round(radius)}px`;
    
    case 'line':
      const dx = shape.endX - shape.startX;
      const dy = shape.endY - shape.startY;
      const length = Math.round(Math.sqrt(dx*dx + dy*dy));
      const angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
      return `Length: ${length}px, Angle: ${angle}°`;
    
    default:
      return '';
  }
};
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <strong>Tool:</strong> {{ getToolName(props.activeTool) }}
    </div>
    
    <div class="status-item">
      <strong>Stroke Color:</strong> {{ formatColor(props.activeColor) }}
    </div>
    
    <div class="status-item">
      <strong>Fill Color:</strong> {{ formatColor(props.activeFillColor) }}
    </div>
    
    <div class="status-item" v-if="selectedShape">
      <strong>Selected:</strong> {{ getToolName(selectedShape.type) }} [{{ getDimensionsInfo() }}]
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 30px;
  background-color: #f0f0f0;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  font-size: 0.9rem;
  color: #555;
}

.status-item {
  margin-right: 2rem;
}

strong {
  font-weight: 600;
}
</style>
