<script setup>
import { ref, defineEmits } from 'vue';
import dbService from '../services/DatabaseService';

const emit = defineEmits(['load-drawing']);

const showModal = ref(false);
const drawings = ref([]);
const currentAction = ref('load'); // 'load' or 'save'
const drawingName = ref('');
const error = ref('');
const loadingData = ref(false);

// Open the drawing manager modal
const openManager = (action) => {
  currentAction.value = action;
  error.value = '';
  
  if (action === 'save') {
    drawingName.value = `Building Plan ${new Date().toLocaleDateString()}`;
  } else {
    drawingName.value = '';
    loadDrawings();
  }
  
  showModal.value = true;
};

// Load all drawings from the database
const loadDrawings = async () => {
  loadingData.value = true;
  
  try {
    drawings.value = await dbService.getAllDrawings();
    drawings.value.sort((a, b) => 
      new Date(b.lastModified) - new Date(a.lastModified)
    );
  } catch (err) {
    console.error('Error loading drawings:', err);
    error.value = 'Failed to load drawings.';
  } finally {
    loadingData.value = false;
  }
};

// Save current drawing
const saveDrawing = async (shapes) => {
  if (!drawingName.value.trim()) {
    error.value = 'Please enter a drawing name.';
    return;
  }

  loadingData.value = true;
  
  try {
    await dbService.saveDrawing(drawingName.value, shapes);
    showModal.value = false;
    return true;
  } catch (err) {
    console.error('Error saving drawing:', err);
    error.value = 'Failed to save drawing.';
    return false;
  } finally {
    loadingData.value = false;
  }
};

// Load a selected drawing
const selectDrawing = (drawing) => {
  emit('load-drawing', drawing.shapes);
  showModal.value = false;
};

// Delete a drawing
const deleteDrawing = async (event, id) => {
  event.stopPropagation(); // Prevent loading the drawing
  
  if (confirm('Are you sure you want to delete this drawing?')) {
    loadingData.value = true;
    
    try {
      await dbService.deleteDrawing(id);
      await loadDrawings(); // Refresh the list
    } catch (err) {
      console.error('Error deleting drawing:', err);
      error.value = 'Failed to delete drawing.';
    } finally {
      loadingData.value = false;
    }
  }
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Close the modal
const closeModal = () => {
  showModal.value = false;
};

defineExpose({
  openManager,
  saveDrawing
});
</script>

<template>
  <div v-if="showModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ currentAction === 'save' ? 'Save Drawing' : 'Load Drawing' }}</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Save Drawing UI -->
        <div v-if="currentAction === 'save'" class="save-form">
          <div class="form-group">
            <label for="drawing-name">Drawing Name:</label>
            <input 
              id="drawing-name" 
              v-model="drawingName" 
              type="text" 
              placeholder="Enter a name for your drawing"
            />
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
        </div>
        
        <!-- Load Drawing UI -->
        <div v-else class="load-drawings">
          <div v-if="loadingData" class="loading-indicator">
            Loading drawings...
          </div>
          
          <div v-else-if="drawings.length === 0" class="no-drawings">
            No saved drawings found. Create and save a drawing first.
          </div>
          
          <div v-else class="drawings-list">
            <div 
              v-for="drawing in drawings" 
              :key="drawing.id"
              class="drawing-item"
              @click="selectDrawing(drawing)"
            >
              <div class="drawing-info">
                <div class="drawing-name">{{ drawing.name }}</div>
                <div class="drawing-date">Last modified: {{ formatDate(drawing.lastModified) }}</div>
              </div>
              
              <button 
                class="delete-button" 
                @click="(event) => deleteDrawing(event, drawing.id)"
                title="Delete drawing"
              >
                Delete
              </button>
            </div>
            
            <div v-if="error" class="error-message">{{ error }}</div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button v-if="currentAction === 'save'" class="primary-button" @click="$emit('save-confirmed')">
          Save
        </button>
        <button class="secondary-button" @click="closeModal">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex-grow: 1;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.error-message {
  color: #d9534f;
  margin-top: 1rem;
}

.drawings-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.drawing-item {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.drawing-item:hover {
  background-color: #f5f5f5;
}

.drawing-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.drawing-date {
  font-size: 0.8rem;
  color: #666;
}

.delete-button {
  padding: 0.25rem 0.5rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  cursor: pointer;
}

.delete-button:hover {
  background-color: #f5c6cb;
}

.no-drawings {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}

.loading-indicator {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}

.primary-button {
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
}

.primary-button:hover {
  background-color: #3aa876;
}

.secondary-button {
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
}

.secondary-button:hover {
  background-color: #e0e0e0;
}
</style>
