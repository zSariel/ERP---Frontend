import "./SearchBar.css";

function SearchBar({ value, onChange, placeholder = "Pesquisar..." }) {
  return (
    <input
      className="search-bar"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

export default SearchBar;