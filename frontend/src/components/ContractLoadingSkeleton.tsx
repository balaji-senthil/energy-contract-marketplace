const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

const ContractLoadingSkeleton = () => {
  return (
    <div className="contractsSkeleton" aria-busy="true" aria-live="polite">
      <div className="tableWrapper">
        <table className="contractsTable">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Energy Type</th>
              <th>Quantity (MWh)</th>
              <th>Price / MWh</th>
              <th>Delivery Window</th>
              <th>Location</th>
              <th>Status</th>
              <th>Portfolio</th>
              <th>Compare</th>
            </tr>
          </thead>
          <tbody>
            {SKELETON_ROWS.map((row) => (
              <tr key={row} className="skeletonRow">
                <td>
                  <span className="skeletonLine skeletonLineSm" />
                </td>
                <td>
                  <span className="skeletonLine skeletonLineMd" />
                </td>
                <td>
                  <span className="skeletonLine skeletonLineMd" />
                </td>
                <td>
                  <span className="skeletonLine skeletonLineMd" />
                </td>
                <td>
                  <span className="skeletonLine skeletonLineLg" />
                </td>
                <td>
                  <span className="skeletonLine skeletonLineMd" />
                </td>
                <td>
                  <span className="skeletonPill" />
                </td>
                <td>
                  <span className="skeletonButton" />
                </td>
                <td>
                  <span className="skeletonLine skeletonLineSm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cardsGrid skeletonCardsGrid">
        {SKELETON_ROWS.slice(0, 3).map((row) => (
          <article className="contractCard skeletonCard" key={row}>
            <div className="cardHeader">
              <div>
                <span className="skeletonLine skeletonLineXs" />
                <span className="skeletonLine skeletonLineSm" />
              </div>
              <span className="skeletonPill" />
            </div>
            <div className="cardBody">
              <div>
                <span className="skeletonLine skeletonLineXs" />
                <span className="skeletonLine skeletonLineMd" />
              </div>
              <div>
                <span className="skeletonLine skeletonLineXs" />
                <span className="skeletonLine skeletonLineMd" />
              </div>
              <div>
                <span className="skeletonLine skeletonLineXs" />
                <span className="skeletonLine skeletonLineMd" />
              </div>
              <div>
                <span className="skeletonLine skeletonLineXs" />
                <span className="skeletonLine skeletonLineLg" />
              </div>
              <div>
                <span className="skeletonLine skeletonLineXs" />
                <span className="skeletonLine skeletonLineMd" />
              </div>
            </div>
            <div className="cardActions">
              <span className="skeletonButton" />
              <span className="skeletonButton skeletonButtonWide" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ContractLoadingSkeleton;
