'use client';

export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-32"></div>
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
      ))}
      <div className="flex gap-4">
        <div className="h-10 bg-blue-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
};

export default function SkeletonLoader({ type = 'table', ...props }) {
  switch (type) {
    case 'table':
      return <TableSkeleton {...props} />;
    case 'card':
      return <CardSkeleton {...props} />;
    case 'list':
      return <ListSkeleton {...props} />;
    case 'form':
      return <FormSkeleton {...props} />;
    default:
      return <TableSkeleton {...props} />;
  }
}
