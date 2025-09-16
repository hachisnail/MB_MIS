export const conversationSample = [
  {
    id: 1,
    laneLabel: "MOA",
    laneVariant: "donor", // styled as donor
    message: "Initial submission of the MOA draft.",
    author: "Donor",
    badge: "Submitted",
  },
  {
    id: 2,
    laneLabel: "Suggestions",
    laneVariant: "donor",
    message: "Pa bago po yung pangalan ng beneficiary para mas klaro.",
    author: "Donor",
  },
  {
    id: 3,
    laneLabel: "",
    laneVariant: "admin",
    badge: "MOA Approved", // badge-only row
  },
  {
    id: 4,
    laneLabel: "Reasons",
    laneVariant: "donor",
    message:
      "Kailangan lang linawin yung spelling ng barangay.\n\n" +
      "Example of multiline with line breaks.",
    author: "Donor",
  },
  {
    id: 5,
    laneLabel: "Admin Review",
    laneVariant: "admin",
    message:
      "Sige, inedit ko na sa MOA. Paki check ulit kung tama na spelling.\n\n" +
      "Also testing ultra-long tokens: " +
      "https://this-is-a-super-long-url-example.com/" +
      "path/to/resource/with/reallyreallyreallylonghashhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
    author: "Admin",
  },
  {
    id: 6,
    laneLabel: "Admin Followup",
    laneVariant: "admin",
    message: "Ipa-review mo ulit please.",
    author: "Admin",
    badge: "Pending Donor Approval",
  },
  {
    id: 7,
    laneLabel: "Donor Final",
    laneVariant: "donor",
    message: "Okay na po! Approved on my side ✅",
    author: "Donor",
  },
  {
    id: 8,
    laneLabel: "Completion",
    laneVariant: "admin",
    badge: "Archived", // shows a row with just the badge + dot
  },
];
