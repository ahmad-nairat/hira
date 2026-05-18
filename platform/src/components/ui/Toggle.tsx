import { InputHTMLAttributes, forwardRef } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Toggle = forwardRef<HTMLInputElement, Props>(function Toggle(props, ref) {
  return (
    <span className="toggle">
      <input type="checkbox" ref={ref} {...props} />
      <span className="slider" />
    </span>
  )
})
export default Toggle
