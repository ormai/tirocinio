<script lang="ts" module>
  export interface Row extends Record<string, unknown> {
    id: number;
  }

  export interface Filter<T extends Row> {
    isSatisfied(row: T): boolean;
    get canApply(): boolean;
    get isActive(): boolean;
    clear(): void;
    apply(): void;
  }
</script>
