import useTradeBookStore from "../lib/tradesStore";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
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
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    MoreHorizontal,
    ChevronDown,
} from "lucide-react";
import React from "react";

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
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "timestamp", desc: true },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter transactions..."
                    value={
                        (table
                            .getColumn("exchange1")
                            ?.getFilterValue() as string) ?? ""
                    }
                    onChange={(event) =>
                        table
                            .getColumn("exchange1")
                            ?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
                                                      header.column.columnDef
                                                          .header,
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
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString();
}

export const columns: ColumnDef<Trade>[] = [
    {
        accessorKey: "timestamp",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Time
                    {column.getIsSorted() === "asc" && (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    )}
                    {column.getIsSorted() === "desc" && (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            );
        },
        cell: ({ cell }) => {
            return <div>{formatDate(cell.getValue())}</div>;
        },
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
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Profit
                    {column.getIsSorted() === "asc" && (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    )}
                    {column.getIsSorted() === "desc" && (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            );
        },
    },
];

export default function TradeBook() {
    const { getTrade } = useTradeBookStore();

    return (
        <div className="w-full py-10 px-8">
            <DataTable columns={columns} data={getTrade()} />
        </div>
    );
}
