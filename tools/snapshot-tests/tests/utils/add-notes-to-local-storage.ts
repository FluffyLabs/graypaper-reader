const notes = {
  version: 3,
  notes: [
    {
      noteVersion: 3,
      content: "asdasdasd",
      date: 1759742271192,
      author: "",
      selectionStart: { pageNumber: 1, index: 88 },
      selectionEnd: { pageNumber: 1, index: 96 },
      version: "ab2cdbd5b070ba2176e8dd830b06401ce05a954d",
      labels: ["local"],
    },
    {
      noteVersion: 3,
      content: "sadasd",
      date: 1759742258606,
      author: "",
      selectionStart: { pageNumber: 1, index: 85 },
      selectionEnd: { pageNumber: 1, index: 86 },
      version: "ab2cdbd5b070ba2176e8dd830b06401ce05a954d",
      labels: ["local"],
    },
  ],
};

const labels = [
  { label: "local/local", isActive: true },
  { label: "local", isActive: true },
  { label: "remote/fluffy-labs", isActive: true },
  { label: "remote", isActive: true },
];

export const initialLocalStorage = [
  {
    name: "notes-v2",
    value: JSON.stringify(notes),
  },
  {
    name: "labels-v1",
    value: JSON.stringify(labels),
  },
];
