<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  activeTool: {
    type: String,
    required: true
  },
  canDelete: {
    type: Boolean,
    default: false
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

const emit = defineEmits([
  'tool-change', 
  'toggle-annotations', 
  'delete-shape',
  'color-change',
  'fill-color-change'
]);

// Available colors for the color picker
const colors = [
  '#333333',
  '#e53935',
  '#43a047',
  '#1e88e5',
  '#fdd835',
  '#8e24aa',
  '#fb8c00',
  '#546e7a'
];

// Available fill colors including transparent
const fillColors = [
  'transparent',
  '#f5f5f5',
  '#ffcdd2',
  '#c8e6c9',
  '#bbdefb',
  '#fff9c4',
  '#e1bee7',
  '#ffe0b2',
  '#cfd8dc'
];

// Current selected color and fill color
const selectedColor = ref(props.activeColor);
const selectedFillColor = ref(props.activeFillColor);

// Watch for props changes
watch(() => props.activeColor, (newColor) => {
  selectedColor.value = newColor;
});

watch(() => props.activeFillColor, (newColor) => {
  selectedFillColor.value = newColor;
});

const selectTool = (tool) => {
  emit('tool-change', tool);
};

const handleToggleAnnotations = () => {
  emit('toggle-annotations');
};

const handleDeleteShape = () => {
  emit('delete-shape');
};

const selectColor = (color) => {
  selectedColor.value = color;
  emit('color-change', color);
};

const selectFillColor = (color) => {
  selectedFillColor.value = color;
  emit('fill-color-change', color);
};
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-title">Tools</div>
    
    <div class="toolbar-section">
      <div class="section-title">Drawing</div>
      <button 
        class="tool-button" 
        :class="{ active: activeTool === 'line' }"
        @click="selectTool('line')" 
        title="Line Tool"
      >
        <i class="icon">╱</i>
        <span>Line</span>
      </button>
      
      <button 
        class="tool-button" 
        :class="{ active: activeTool === 'rectangle' }"
        @click="selectTool('rectangle')" 
        title="Rectangle Tool"
      >
        <i class="icon">□</i>
        <span>Rectangle</span>
      </button>

      <button 
        class="tool-button" 
        :class="{ active: activeTool === 'circle' }"
        @click="selectTool('circle')" 
        title="Circle Tool"
      >
        <i class="icon">○</i>
        <span>Circle</span>
      </button>
    </div>
    
    <div class="toolbar-section">
      <div class="section-title">Edit</div>
      <button 
        class="tool-button" 
        :class="{ active: activeTool === 'select' }"
        @click="selectTool('select')" 
        title="Select Tool"
      >
        <i class="icon">↖</i>
        <span>Select</span>
      </button>
      
      <button 
        class="tool-button"
        :disabled="!canDelete"
        @click="handleDeleteShape" 
        title="Delete Selected"
      >
        <i class="icon">🗑</i>
        <span>Delete</span>
      </button>
    </div>
    
    <div class="toolbar-section">
      <div class="section-title">View</div>
      <button 
        class="tool-button" 
        @click="handleToggleAnnotations" 
        title="Toggle Annotations"
      >
        <i class="icon">📐</i>
        <span>Annotations</span>
      </button>
    </div>
    
    <div class="toolbar-section">
      <div class="section-title">Appearance</div>
      <div class="color-section">
        <div class="color-label">Stroke:</div>
        <div class="color-picker">
          <div 
            v-for="color in colors" 
            :key="color"
            class="color-option"
            :class="{ active: selectedColor === color }"
            :style="{ backgroundColor: color }"
            @click="selectColor(color)"
            :title="color"
          ></div>
        </div>
      </div>
      
      <div class="color-section">
        <div class="color-label">Fill:</div>
        <div class="color-picker">
          <div 
            v-for="color in fillColors" 
            :key="color"
            class="color-option"
            :class="{ active: selectedFillColor === color, 'transparent': color === 'transparent' }"
            :style="{ backgroundColor: color }"
            @click="selectFillColor(color)"
            :title="color === 'transparent' ? 'No Fill' : color"
          >
            <span v-if="color === 'transparent'" class="no-fill">❌</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  width: 200px;
  background-color: #f0f0f0;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
}

.toolbar-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.toolbar-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #555;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.25rem;
}

.tool-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.tool-button:hover {
  background-color: #e9e9e9;
}

.tool-button.active {
  background-color: #42b983;
  color: white;
}

.tool-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  margin-right: 0.5rem;
  font-style: normal;
  font-size: 1.2rem;
}

/* Color picker styles */
.color-section {
  margin-bottom: 1rem;
}

.color-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-option.active {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px #333;
  z-index: 1;
}

.color-option:hover {
  transform: scale(1.05);
}

.color-option.transparent {
  background-image: linear-gradient(45deg, #eee 25%, transparent 25%), 
                    linear-gradient(-45deg, #eee 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #eee 75%), 
                    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.no-fill {
  font-size: 10px;
  color: #e53935;
}
</style>
