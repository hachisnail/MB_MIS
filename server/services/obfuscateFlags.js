const xor = (str, key) =>
  Buffer.from(str)
    .map((b, i) => b ^ key.charCodeAt(i % key.length))
    .toString("base64");  // Use base64 to encode the XOR result

const routeKeyMap = {};  // For mapping route_key to an alias (for obfuscation)
let symbolCounter = 0;

// Function to obfuscate and encode the flags data
export function mapAndObfuscateFlags(flags, secret = "museo") {
  const flagMap = {};  // Map to store the flag data (route_key => is_enabled)
  for (const flag of flags) {
    // Generate a unique alias for each route_key
    if (!routeKeyMap[flag.route_key]) {
      symbolCounter++;
      routeKeyMap[flag.route_key] = `a${symbolCounter}`;
    }
    const alias = routeKeyMap[flag.route_key];  // Use alias instead of route_key
    flagMap[alias] = flag.is_enabled;  // Store the flag's enabled state
  }

  // XOR encode both the flags map and the routeKeyMap
  const encodedFlags = xor(JSON.stringify(flagMap), secret);  // Encode the flag map
  const encodedKeyMap = xor(JSON.stringify(routeKeyMap), secret);  // Encode the key map

  return { encoded: encodedFlags, keys: encodedKeyMap };  // Return encoded data
}
