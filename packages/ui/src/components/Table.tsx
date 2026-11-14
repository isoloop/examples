/** @jsxImportSource preact */
import type { ComponentChildren, VNode } from 'preact';

export interface TableProps {
  caption: ComponentChildren;
  /** Column headings, each unique (they key the cells). The first column of each row is its row heading. */
  head: string[];
  /** One cell per heading. The first, the row's heading, is text and unique: it keys the row. */
  rows: [string, ...ComponentChildren[]][];
  /** Mark the last column, Isoloop's, with the pool colour. */
  markLast?: boolean;
}

/**
 * A data table with a caption and headers on both axes, scrolling sideways on
 * narrow screens instead of the page (ADR 0002, decision 9).
 */
export function Table({ caption, head, rows, markLast = false }: TableProps): VNode {
  return (
    <div
      class="ui-table-wrap"
      tabindex={0}
      role="region"
      aria-label={typeof caption === 'string' ? caption : undefined}
    >
      <table class="ui-table" data-mark-last={markLast ? '' : undefined}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {head.map((col, j) =>
                j === 0 ? (
                  <th scope="row" key={col}>
                    {row[j]}
                  </th>
                ) : (
                  <td key={col}>{row[j]}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
