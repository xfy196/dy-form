import type { Component } from 'vue'
import type { WidgetType } from '@/schema/types'
import InputWidget from './InputWidget.vue'
import TextareaWidget from './TextareaWidget.vue'
import InputNumberWidget from './InputNumberWidget.vue'
import SelectWidget from './SelectWidget.vue'
import RadioWidget from './RadioWidget.vue'
import CheckboxWidget from './CheckboxWidget.vue'
import SwitchWidget from './SwitchWidget.vue'
import DatePickerWidget from './DatePickerWidget.vue'
import TimePickerWidget from './TimePickerWidget.vue'
import DividerWidget from './DividerWidget.vue'

export const widgetRegistry: Record<WidgetType, Component> = {
  Input: InputWidget,
  Textarea: TextareaWidget,
  InputNumber: InputNumberWidget,
  Select: SelectWidget,
  Radio: RadioWidget,
  Checkbox: CheckboxWidget,
  Switch: SwitchWidget,
  DatePicker: DatePickerWidget,
  TimePicker: TimePickerWidget,
  Divider: DividerWidget,
}

export function resolveWidget(type: WidgetType): Component {
  const widget = widgetRegistry[type]
  if (!widget) {
    throw new Error(`Unknown widget: ${type}`)
  }
  return widget
}
