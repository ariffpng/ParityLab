/** A visually hidden data table: the text alternative for a chart or diagram. */
export function SrTable({ caption, rows }: { caption: string; rows: [string, string][] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
