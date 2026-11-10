/** Shows English text with its Hindi translation (if any) underneath. */
export default function Bi({ en, hi, className = '', hiClassName = '' }) {
  return (
    <span className={className}>
      <span className="block">{en}</span>
      {hi ? <span className={`block mt-0.5 text-[0.95em] opacity-80 ${hiClassName}`}>{hi}</span> : null}
    </span>
  )
}
