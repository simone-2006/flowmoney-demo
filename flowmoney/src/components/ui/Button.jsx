export default function Button({ children, size = "m", ...props }) {
  const sizeClasses = {
    s: "px-2 py-1 text-sm",
    m: "px-3 py-2 text-base",
    l: "px-5 py-3 text-lg"
  };
  return (
    <button
      className={`bg-green-600 text-white corner-squircle rounded-2xl font-bold hover:bg-green-700 transition-all ${sizeClasses[size] || sizeClasses.m}`}
      {...props}
    >
      {children}
    </button>
  );
}