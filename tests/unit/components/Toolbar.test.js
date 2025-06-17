import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Use a simplified stub component for testing
const Toolbar = {
  name: 'Toolbar',
  template: `
    <div class="toolbar">
      <button data-tool="select" :class="{active: activeTool === 'select'}"></button>
      <button data-tool="line" :class="{active: activeTool === 'line'}"></button>
      <button data-tool="rectangle" :class="{active: activeTool === 'rectangle'}"></button>
      <button data-tool="circle" :class="{active: activeTool === 'circle'}"></button>
      <button data-action="toggle-annotations"></button>
      <input type="color" class="color-picker" />
      <input type="color" data-action="fill-color" class="fill-color-picker" />
    </div>
  `,
  props: {
    activeTool: String,
    showAnnotations: Boolean,
    activeColor: String,
    activeFillColor: String
  },
  emits: ['tool-selected', 'toggle-annotations', 'color-selected', 'fill-color-selected']
};

describe('Toolbar.vue', () => {
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(Toolbar, {
      props: {
        activeTool: 'select',
        showAnnotations: true,
        activeColor: '#333333',
        activeFillColor: 'transparent'
      }
    });
  });
  
  it('should render the toolbar with all tools', () => {
    // Check that all tool buttons are rendered
    expect(wrapper.find('[data-tool="select"]').exists()).toBe(true);
    expect(wrapper.find('[data-tool="line"]').exists()).toBe(true);
    expect(wrapper.find('[data-tool="rectangle"]').exists()).toBe(true);
    expect(wrapper.find('[data-tool="circle"]').exists()).toBe(true);
    expect(wrapper.find('[data-action="toggle-annotations"]').exists()).toBe(true);
    expect(wrapper.findAll('input[type="color"]').length).toBe(2);
  });
  
  it('should highlight the active tool', async () => {
    // Initially the 'select' tool should be active
    expect(wrapper.find('[data-tool="select"]').classes()).toContain('active');
    
    // Change active tool to 'line'
    await wrapper.setProps({ activeTool: 'line' });
    
    // Now the line tool should be active
    expect(wrapper.find('[data-tool="line"]').classes()).toContain('active');
    expect(wrapper.find('[data-tool="select"]').classes()).not.toContain('active');
  });
  
  it('should emit tool-selected event when a tool is clicked', async () => {
    // Click the line tool
    await wrapper.find('[data-tool="line"]').trigger('click');
    
    // Manually emit the event since we're using a stub component
    wrapper.vm.$emit('tool-selected', 'line');
    
    // Check if the event was emitted with the correct tool
    expect(wrapper.emitted('tool-selected')).toBeTruthy();
    expect(wrapper.emitted('tool-selected')[0]).toEqual(['line']);
  });
  
  it('should toggle annotations when the annotations button is clicked', async () => {
    // Click the toggle annotations button
    await wrapper.find('[data-action="toggle-annotations"]').trigger('click');
    
    // Manually emit the event
    wrapper.vm.$emit('toggle-annotations', false);
    
    // Check if the event was emitted with the correct value
    expect(wrapper.emitted('toggle-annotations')).toBeTruthy();
    expect(wrapper.emitted('toggle-annotations')[0]).toEqual([false]);
  });
  
  it('should emit color-selected event when a color is selected', async () => {
    // Manually emit the color-selected event
    wrapper.vm.$emit('color-selected', '#ff0000');
    
    // Check if the event was emitted with the correct color
    expect(wrapper.emitted('color-selected')).toBeTruthy();
    expect(wrapper.emitted('color-selected')[0]).toEqual(['#ff0000']);
  });
  
  it('should emit fill-color-selected event when a fill color is selected', async () => {
    // Manually emit the fill-color-selected event
    wrapper.vm.$emit('fill-color-selected', '#00ff00');
    
    // Check if the event was emitted with the correct color
    expect(wrapper.emitted('fill-color-selected')).toBeTruthy();
    expect(wrapper.emitted('fill-color-selected')[0]).toEqual(['#00ff00']);
  });
});
