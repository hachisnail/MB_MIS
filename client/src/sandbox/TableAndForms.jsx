// import React, { useMemo, useState } from "react";
// import {
//   createColumnHelper,
//   useReactTable,
//   getCoreRowModel,
//   getSortedRowModel,
//   flexRender,
// } from "@tanstack/react-table";

// const TableAndForms = () => {
//   // Memoized data
//   const data = useMemo(
//     () => [
//       { id: 1, firstName: "Jeff", lastName: "Talagtag", age: 30 },
//       { id: 2, firstName: "Alice", lastName: "Smith", age: 25 },
//       { id: 3, firstName: "Bob", lastName: "Johnson", age: 40 },
//     ],
//     []
//   );

//   const columnHelper = createColumnHelper();

//   // Memoized columns
//   const columns = useMemo(
//     () => [
//       columnHelper.accessor("id", {
//         header: "ID",
//         cell: (info) => info.getValue(),
//       }),
//       columnHelper.accessor("firstName", {
//         header: "First Name",
//         cell: (info) => info.getValue(),
//       }),
//       columnHelper.accessor("lastName", {
//         header: "Last Name",
//         cell: (info) => info.getValue(),
//       }),
//       columnHelper.accessor("age", {
//         header: "Age",
//         cell: (info) => info.getValue(),
//       }),
//     ],
//     []
//   );

//   // Sorting state
//   const [sorting, setSorting] = useState([]);

//   // Create table instance
//   const table = useReactTable({
//     data,
//     columns,
//     state: { sorting },
//     onSortingChange: setSorting,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//   });

//   return (
//     <div>
//       <table className="border-collapse w-f">
//         <thead>
//           {table.getHeaderGroups().map((headerGroup) => (
//             <tr key={headerGroup.id}>
//               {headerGroup.headers.map((header) => (
//                 <th
//                   key={header.id}
//                   onClick={header.column.getToggleSortingHandler()}
//                   style={{
//                     cursor: "pointer",
//                     padding: "0.5rem",
//                     borderBottom: "1px solid #ddd",
//                     textAlign: "left",
//                   }}
//                 >
//                   {flexRender(header.column.columnDef.header, header.getContext())}
//                   {{
//                     asc: " 🔼",
//                     desc: " 🔽",
//                   }[header.column.getIsSorted()] ?? null}
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>
//         <tbody>
//           {table.getRowModel().rows.map((row) => (
//             <tr key={row.id}>
//               {row.getVisibleCells().map((cell) => (
//                 <td
//                   key={cell.id}
//                   style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}
//                 >
//                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default TableAndForms;


import React from 'react'

const TableAndForms = () => {
  return (
    <div>
      
    </div>
  )
}

export default TableAndForms
