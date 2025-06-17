<script setup>
import { ref, onMounted } from 'vue';
import DrawingCanvas from './components/DrawingCanvas.vue';
import Toolbar from './components/Toolbar.vue';
import StatusBar from './components/StatusBar.vue';
import DrawingManager from './components/DrawingManager.vue';

const activeTool = ref('select');
const shapes = ref([]);
const selectedShape = ref(null);
const showAnnotations = ref(true);
const drawingManager = ref(null);
const activeColor = ref('#333333');
const activeFillColor = ref('transparent');

const handleToolChange = (tool) => {
  activeTool.value = tool;
  selectedShape.value = null;
};

const handleShapeAdded = (shape) => {
  shapes.value.push(shape);
};

const handleShapeSelected = (shape) => {
  selectedShape.value = shape;
  
  if (shape) {
    // When selecting a shape, update the active colors to match the selected shape
    activeColor.value = shape.color || '#333333';
    activeFillColor.value = shape.fillColor || 'transparent';
  }
};

const handleShapeUpdated = (updatedShape) => {
  const index = shapes.value.findIndex(shape => shape.id === updatedShape.id);
  if (index !== -1) {
    shapes.value[index] = updatedShape;
  }
};

const handleDeleteShape = () => {
  if (selectedShape.value) {
    shapes.value = shapes.value.filter(shape => shape.id !== selectedShape.value.id);
    selectedShape.value = null;
  }
};

const toggleAnnotations = () => {
  showAnnotations.value = !showAnnotations.value;
};

const saveDrawing = async () => {
  if (drawingManager.value) {
    drawingManager.value.openManager('save');
  }
};

const handleSaveConfirmed = async () => {
  if (drawingManager.value) {
    const success = await drawingManager.value.saveDrawing(shapes.value);
    if (success) {
      alert('Drawing saved successfully!');
    }
  }
};

const loadDrawing = () => {
  if (drawingManager.value) {
    drawingManager.value.openManager('load');
  }
};

const handleLoadDrawing = (loadedShapes) => {
  shapes.value = loadedShapes;
  selectedShape.value = null;
};

const handleColorChange = (color) => {
  activeColor.value = color;
  
  // If a shape is selected, update its color
  if (selectedShape.value) {
    const updatedShape = { ...selectedShape.value, color };
    handleShapeUpdated(updatedShape);
  }
};

const handleFillColorChange = (color) => {
  activeFillColor.value = color;
  
  // If a shape is selected, update its fill color
  if (selectedShape.value) {
    const updatedShape = { ...selectedShape.value, fillColor: color };
    handleShapeUpdated(updatedShape);
  }
};

// Export the drawing as an image
function exportDrawing() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.warn('No canvas element found');
    return;
  }
  
  try {
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Copy the original canvas content
    tempCtx.drawImage(canvas, 0, 0);
    
    // Add a title to the exported image
    tempCtx.font = 'bold 16px Arial';
    tempCtx.fillStyle = '#333';
    tempCtx.fillText('Building Planner - ' + new Date().toLocaleDateString(), 10, 20);

    // Create a download link
    const link = document.createElement('a');
    link.download = `building-plan-${new Date().toISOString().substring(0, 10)}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    console.error('Error exporting drawing', e);
    alert('Error exporting drawing: ' + e.message);
  }
}

// Add keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    // Ctrl+S / Cmd+S for Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDrawing();
    }
    
    // Ctrl+E / Cmd+E for Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportDrawing();
    }
  });
});
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Building Planner</h1>
      <div class="actions">
        <button @click="saveDrawing">Save</button>
        <button @click="loadDrawing">Load</button>
        <button @click="exportDrawing">Export</button>
      </div>
    </header>
    
    <main>
      <Toolbar 
        :activeTool="activeTool"
        @tool-change="handleToolChange"
        @toggle-annotations="toggleAnnotations"
        @delete-shape="handleDeleteShape"
        :canDelete="selectedShape !== null"
        :activeColor="activeColor"
        :activeFillColor="activeFillColor"
        @color-change="handleColorChange"
        @fill-color-change="handleFillColorChange"
      />
      
      <DrawingCanvas 
        :activeTool="activeTool"
        :shapes="shapes"
        :selectedShape="selectedShape"
        :showAnnotations="showAnnotations"
        :activeColor="activeColor"
        :activeFillColor="activeFillColor"
        @shape-added="handleShapeAdded"
        @shape-selected="handleShapeSelected"
        @shape-updated="handleShapeUpdated"
      />
    </main>
    
    <StatusBar 
      :activeTool="activeTool" 
      :selectedShape="selectedShape"
      :activeColor="activeColor"
      :activeFillColor="activeFillColor" 
    />
    
    <DrawingManager
      ref="drawingManager"
      @load-drawing="handleLoadDrawing"
      @save-confirmed="handleSaveConfirmed"
    />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions button {
  margin-left: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.actions button:hover {
  background-color: #3aa876;
}

main {
  display: flex;
  flex-grow: 1;
  height: calc(100vh - 120px);
  overflow: hidden;
}
</style>
