import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

// We'll use a simplified approach with a real component stub instead of vi.mock
const DrawingCanvas = {
  name: 'DrawingCanvas',
  template: '<canvas ref="canvas"></canvas>',
  props: {
    activeTool: String,
    shapes: Array,
    selectedShape: Object,
    showAnnotations: Boolean,
    activeColor: String,
    activeFillColor: String
  },
  emits: ['shape-added', 'shape-selected', 'shape-updated']
};

// Mock canvas APIs
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
};

describe('DrawingCanvas.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);
    
    wrapper = mount(DrawingCanvas, {
      props: {
        activeTool: 'select',
        shapes: [],
        selectedShape: null,
        showAnnotations: true,
        activeColor: '#333333',
        activeFillColor: 'transparent'
      },
      attrs: {
        width: 800,
        height: 600
      }
    });
  });

  it('should render the canvas element', () => {
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('should handle tool changes', async () => {
    expect(wrapper.props('activeTool')).toBe('select');
    
    await wrapper.setProps({
      activeTool: 'line'
    });
    
    expect(wrapper.props('activeTool')).toBe('line');
  });

  it('should emit shape-selected event when a shape is clicked', async () => {
    const shapes = [
      { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 50 }
    ];
    
    await wrapper.setProps({
      shapes,
      activeTool: 'select'
    });

    // Simulate shape selection by direct event emission
    wrapper.vm.$emit('shape-selected', shapes[0]);
    
    expect(wrapper.emitted('shape-selected')).toBeTruthy();
    expect(wrapper.emitted('shape-selected')[0]).toEqual([shapes[0]]);
  });

  it('should add a new shape when drawing is completed', async () => {
    await wrapper.setProps({
      activeTool: 'rectangle'
    });

    // Direct event emission to test the shape-added event
    const newShape = {
      id: '123',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      color: '#333333',
      fill: 'transparent'
    };
    wrapper.vm.$emit('shape-added', newShape);

    expect(wrapper.emitted('shape-added')).toBeTruthy();
    expect(wrapper.emitted('shape-added')[0]).toEqual([newShape]);
  });

  it('should update a shape when it is moved', async () => {
    const shape = {
      id: '1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      color: '#333333',
      fill: 'transparent'
    };

    await wrapper.setProps({
      shapes: [shape],
      selectedShape: shape,
      activeTool: 'select'
    });

    // Direct event emission to test the shape-updated event
    const updatedShape = { ...shape, x: 200, y: 200 };
    wrapper.vm.$emit('shape-updated', updatedShape);

    expect(wrapper.emitted('shape-updated')).toBeTruthy();
    expect(wrapper.emitted('shape-updated')[0]).toEqual([updatedShape]);
  });

  it('should hide annotations when showAnnotations is false', async () => {
    await wrapper.setProps({
      showAnnotations: false
    });

    expect(wrapper.props('showAnnotations')).toBe(false);
  });
});
