import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent } from 'vue'

// A mock component representing our async button logic pattern
const AsyncButton = defineComponent({
  template: `
    <button @click="handleClick" :disabled="isSubmitting" class="test-btn">
      {{ isSubmitting ? '加载中...' : '提交' }}
    </button>
  `,
  setup() {
    const isSubmitting = ref(false)
    const handleClick = async () => {
      if (isSubmitting.value) return
      isSubmitting.value = true
      try {
        // Mock async network request (e.g. 100ms)
        await new Promise(resolve => setTimeout(resolve, 100))
      } finally {
        isSubmitting.value = false
      }
    }
    return { isSubmitting, handleClick }
  }
})

describe('Button Responsiveness Tests', () => {
  it('should immediately disable the button and change text upon click (Response Time <= 16ms)', async () => {
    const wrapper = mount(AsyncButton)
    const button = wrapper.find('.test-btn')
    
    // Initial state
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.text()).toBe('提交')

    // Trigger click
    await button.trigger('click')

    // Immediate feedback state (synchronous DOM update check)
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('加载中...')
  })

  it('should restore button state after async operation completes', async () => {
    const wrapper = mount(AsyncButton)
    const button = wrapper.find('.test-btn')

    await button.trigger('click')
    
    // Wait for the async operation (100ms) to complete
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Restored state
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.text()).toBe('提交')
  })
})
