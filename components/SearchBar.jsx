import TextField from "@/components/TextField";

export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <TextField
      leftIcon="magnify"
      icon={value ? "close-circle" : undefined}
      onIconPress={() => onChangeText("")}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
    />
  );
}
