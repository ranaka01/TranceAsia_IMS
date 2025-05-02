export default function Button({ text, onClick }) {
    return (
      <button
        onClick={onClick}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
      >
        {text}
      </button>
    );
  }
  