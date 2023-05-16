import useTradeBookStore from "../lib/tradesStore";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export type Trade = {
    timestamp: number;
    pair: string;
    exchange1: string;
    exchange2: string;
    price1: number;
    price2: number;
    profit: number;
};

interface DataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
}

export function DataTable<TData extends Record<string, any>>({
    columns,
    data,
}: DataTableProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export const columns: ColumnDef<Trade>[] = [
    {
        accessorKey: "timestamp",
        header: "Timestamp",
    },
    {
        accessorKey: "pair",
        header: "Pair",
    },
    {
        accessorKey: "exchange1",
        header: "Exchange 1",
    },
    {
        accessorKey: "exchange2",
        header: "Exchange 2",
    },
    {
        accessorKey: "price1",
        header: "Price 1",
    },
    {
        accessorKey: "price2",
        header: "Price 2",
    },
    {
        accessorKey: "profit",
        header: "Profit",
    }
];

export default function TradeBook() {
    const { trades } = useTradeBookStore();

    return <div className="w-full py-10 px-8">
        <DataTable columns={columns} data={trades} />
    </div>
}
