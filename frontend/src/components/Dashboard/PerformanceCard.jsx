/**
 * @param {{
 *   title: string,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export default function PerformanceCard({ title, children, className = '' }) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`}>
      <h3>{title}</h3>
      {children}
    </div>
  )
}
