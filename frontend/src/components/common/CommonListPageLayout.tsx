import React from "react";
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Paper,
  CircularProgress,
  PaperProps
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import DataTable from "../DataTable";
import PageHeaderSection from "./PageHeaderSection";

// 直接使用 MuiGrid
const Grid = MuiGrid;

// 定義列的類型
interface Column {
  field: string;
  headerName?: string;
  width?: number;
  renderCell?: (params: any) => React.ReactNode;
  valueGetter?: (params: any) => any;
  type?: string;
  [key: string]: any;
}

/**
 * 通用的列表頁面佈局組件
 */
interface CommonListPageLayoutProps {
  title: string | React.ReactNode;
  actionButtons?: React.ReactNode;
  columns: Column[];
  rows: any[];
  loading: boolean;
  error?: string;
  onRowClick?: (params: any) => void;
  detailPanel?: React.ReactNode;
  tableGridWidth?: number;
  detailGridWidth?: number;
  dataTableProps?: Record<string, any>;
  breadcrumbLabel?: string;
}

const extractText = (node: React.ReactNode): string | undefined => {
  if (node === null || node === undefined) {
    return undefined;
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    const parts = node
      .map(extractText)
      .filter((part): part is string => Boolean(part));
    return parts.length ? parts.join(" ") : undefined;
  }

  if (React.isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    return (
      extractText(props.title as React.ReactNode) ||
      extractText(props.label as React.ReactNode) ||
      extractText(props.children as React.ReactNode)
    );
  }

  return undefined;
};

const CommonListPageLayout: React.FC<CommonListPageLayoutProps> = ({
  title,
  actionButtons,
  columns,
  rows,
  loading,
  error,
  onRowClick,
  detailPanel,
  tableGridWidth = 9,
  detailGridWidth = 3,
  dataTableProps = {},
  breadcrumbLabel,
}) => {
  const {
    containerPaperProps: incomingContainerPaperProps,
    height: incomingHeight,
    pageSize: incomingPageSize,
    ...restDataTableProps
  } = dataTableProps;

  const tableHeight = incomingHeight ?? "74vh";
  const pageSize = incomingPageSize ?? 10;

  const defaultContainerPaperSx = {
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: 2,
  };

  const {
    sx: containerPaperSx,
    elevation: containerPaperElevation,
    variant: containerPaperVariant,
    ...otherContainerPaperProps
  } = (incomingContainerPaperProps as PaperProps | undefined) ?? {};

  const mergedContainerPaperProps: PaperProps = {
    elevation: containerPaperElevation ?? 0,
    variant: containerPaperVariant ?? "outlined",
    ...otherContainerPaperProps,
    sx: containerPaperSx
      ? Array.isArray(containerPaperSx)
        ? [defaultContainerPaperSx, ...containerPaperSx]
        : [defaultContainerPaperSx, containerPaperSx]
      : defaultContainerPaperSx,
  };

  const resolvedBreadcrumbLabel = breadcrumbLabel ?? extractText(title);

  const breadcrumbItems = [
    {
      label: "Home",
      path: "/",
      icon: <HomeIcon sx={{ fontSize: "1.1rem" }} />,
    },
    ...(resolvedBreadcrumbLabel
      ? [
          {
            label: resolvedBreadcrumbLabel,
            icon: null,
          },
        ]
      : []),
  ];

  return (
    <Box sx={{ maxWidth: '100%', pl: 0 }}>
      {/* Header: Title and Action Buttons using PageHeaderSection */}
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '首頁',
            path: '/',
            icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: title,
            icon: null
          }
        ]}
        actions={actionButtons}
      />

      {/* Error Message */}
      {error && (
        <Typography color="error">
          {error}
        </Typography>
      )}

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} md={detailPanel ? tableGridWidth : 12}>
          {loading && !rows.length ? (
            <Paper {...mergedContainerPaperProps}>
              <Box sx={{
                flex: 1,
                minHeight: tableHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CircularProgress />
              </Box>
            </Paper>
          ) : (
            <DataTable
              rows={rows}
              columns={columns}
              loading={loading}
              checkboxSelection={false}
              pageSize={pageSize}
              containerPaperProps={mergedContainerPaperProps}
              height={tableHeight}
              {...(onRowClick && { onRowClick })}
              {...restDataTableProps}
            />
          )}
        </Grid>

        {detailPanel && (
          <Grid item xs={12} md={detailGridWidth} sx={{ minHeight: 0 }}>
            {detailPanel}
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CommonListPageLayout;
