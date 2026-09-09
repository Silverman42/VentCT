export enum DashboardType {
  SIMPLE = "simple",
  ADVANCED = "advanced",
}
export const useDashboardTypeHandler = () => {
  const dashboardType = useState<DashboardType>(
    "useDashboardTypeHandler.dashboardType",
    () => DashboardType.SIMPLE
  );
  const changeDashboardType = (type: DashboardType) => {
    dashboardType.value = type;
  };
  return { dashboardType, changeDashboardType };
};
