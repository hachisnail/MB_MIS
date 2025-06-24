export default function SearchBar({ placeholder = 'Search History', onChange, theme }) {

    let outer, inner;
    switch (theme) {
        case 'dark':
            outer = 'bg-[#191919] border-[#353535]'
            inner = 'text-gray-300 placeholder-gray-500';
            break;
        case 'light':
            outer = 'bg-white border-[#353535]'
            inner = 'text-gray-300 placeholder-gray-500';
            break;
            
    
        default:
            outer = 'bg-white border-[#353535]'
            inner = 'text-gray-300 placeholder-gray-500';
            break;
    }
// theme == 'dark'? 'bg-[#191919] border-[#353535] ': 'bg-white border-[#353535]'
  return (
    <div className="w-full max-w-sm ">
      <div className={`flex items-center ${outer}  border rounded-md px-3 py-2`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          className={`ml-3  w-full bg-transparent outline-none text-2xl ${inner} `}
        />
      </div>
    </div>
  )
}
