export default function Select({ label, children, ...props }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <select className="input bg-white" {...props}>
        {children}
      </select>
    </label>
  );
}
