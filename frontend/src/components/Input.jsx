export default function Input({ label, ...props }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <input className="input" {...props} />
    </label>
  );
}
