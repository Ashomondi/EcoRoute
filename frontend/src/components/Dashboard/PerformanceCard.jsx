/**
 * @param {{
 *   title: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function PerformanceCard({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  )
}
