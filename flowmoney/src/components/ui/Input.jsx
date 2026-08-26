export default function Input({ className = "", ...props }) {
  return (
    <input
      className={
        "px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm rounded-2xl corner-squircle" +
        className
      }
      {...props}
    />
  );
}