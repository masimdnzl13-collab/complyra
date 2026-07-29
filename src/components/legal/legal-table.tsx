import type { ReactNode } from "react";

/**
 * Data-driven table matching the pricing page's card/border styling, wrapped
 * in its own horizontal scroll container so it never breaks mobile layout —
 * `not-prose` opts it out of the typography plugin's default table styles.
 */
export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-xl border border-navy-100 bg-white">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-navy-100">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium text-navy-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top text-navy-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
