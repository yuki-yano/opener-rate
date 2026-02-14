import type { PenetrationEffect } from "./types";

type FlowEdge = {
  to: number;
  reverseEdgeIndex: number;
  capacity: number;
};

const addFlowEdge = (
  graph: FlowEdge[][],
  from: number,
  to: number,
  capacity: number,
) => {
  const forwardEdge: FlowEdge = {
    to,
    reverseEdgeIndex: graph[to].length,
    capacity,
  };
  const reverseEdge: FlowEdge = {
    to: from,
    reverseEdgeIndex: graph[from].length,
    capacity: 0,
  };
  graph[from].push(forwardEdge);
  graph[to].push(reverseEdge);
};

const normalizePoolId = (poolId: string | undefined) => {
  if (poolId == null) return null;
  const normalized = poolId.trim();
  if (normalized.length === 0) return null;
  return normalized;
};

const sanitizePenetrationEffects = (
  penetrationEffects: PenetrationEffect[],
  categoryIndexByKey: Map<string, number>,
) => {
  const normalizedEffects: Array<{
    amount: number;
    categoryIndices: number[];
  }> = [];
  const pooledEffects = new Map<
    string,
    { amount: number; categoryUids: Set<string> }
  >();

  for (const effect of penetrationEffects) {
    if (effect.amount <= 0) continue;
    if (effect.disruptionCategoryUids.length === 0) continue;
    const poolId = normalizePoolId(effect.poolId);
    if (poolId != null) {
      const pooled = pooledEffects.get(poolId);
      if (pooled == null) {
        pooledEffects.set(poolId, {
          amount: effect.amount,
          categoryUids: new Set(effect.disruptionCategoryUids),
        });
      } else {
        pooled.amount = Math.max(pooled.amount, effect.amount);
        for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
          pooled.categoryUids.add(disruptionCategoryUid);
        }
      }
      continue;
    }

    const categoryIndexSet = new Set<number>();
    for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
      const categoryIndex = categoryIndexByKey.get(disruptionCategoryUid);
      if (categoryIndex == null) continue;
      categoryIndexSet.add(categoryIndex);
    }
    if (categoryIndexSet.size === 0) continue;

    normalizedEffects.push({
      amount: effect.amount,
      categoryIndices: Array.from(categoryIndexSet),
    });
  }

  for (const pooled of pooledEffects.values()) {
    const categoryIndexSet = new Set<number>();
    for (const disruptionCategoryUid of pooled.categoryUids) {
      const categoryIndex = categoryIndexByKey.get(disruptionCategoryUid);
      if (categoryIndex == null) continue;
      categoryIndexSet.add(categoryIndex);
    }
    if (categoryIndexSet.size === 0) continue;
    normalizedEffects.push({
      amount: pooled.amount,
      categoryIndices: Array.from(categoryIndexSet),
    });
  }

  return normalizedEffects;
};

const resolveMaxAssignablePenetration = (params: {
  requiredPenetrationByDisruptionKey: Record<string, number>;
  penetrationEffects: PenetrationEffect[];
}) => {
  const { requiredPenetrationByDisruptionKey, penetrationEffects } = params;
  const requirementEntries = Object.entries(requiredPenetrationByDisruptionKey)
    .filter(([, required]) => required > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  if (requirementEntries.length === 0) {
    return { totalRequired: 0, maxAssignable: 0 };
  }

  const categoryIndexByKey = new Map(
    requirementEntries.map(([disruptionKey], index) => [disruptionKey, index]),
  );
  const normalizedEffects = sanitizePenetrationEffects(
    penetrationEffects,
    categoryIndexByKey,
  );
  if (normalizedEffects.length === 0) {
    return {
      totalRequired: requirementEntries.reduce(
        (total, [, required]) => total + required,
        0,
      ),
      maxAssignable: 0,
    };
  }

  const totalRequired = requirementEntries.reduce(
    (total, [, required]) => total + required,
    0,
  );
  const totalSupply = normalizedEffects.reduce(
    (total, effect) => total + effect.amount,
    0,
  );
  if (totalSupply < totalRequired) {
    return {
      totalRequired,
      maxAssignable: totalSupply,
    };
  }

  const source = 0;
  const effectNodeStart = 1;
  const disruptionNodeStart = effectNodeStart + normalizedEffects.length;
  const sink = disruptionNodeStart + requirementEntries.length;
  const graph: FlowEdge[][] = Array.from({ length: sink + 1 }, () => []);

  for (
    let effectIndex = 0;
    effectIndex < normalizedEffects.length;
    effectIndex += 1
  ) {
    const effect = normalizedEffects[effectIndex];
    const effectNode = effectNodeStart + effectIndex;
    addFlowEdge(graph, source, effectNode, effect.amount);
    for (const categoryIndex of effect.categoryIndices) {
      const disruptionNode = disruptionNodeStart + categoryIndex;
      addFlowEdge(graph, effectNode, disruptionNode, effect.amount);
    }
  }

  for (
    let requirementIndex = 0;
    requirementIndex < requirementEntries.length;
    requirementIndex += 1
  ) {
    const [, required] = requirementEntries[requirementIndex];
    const disruptionNode = disruptionNodeStart + requirementIndex;
    addFlowEdge(graph, disruptionNode, sink, required);
  }

  const level = new Array(graph.length).fill(-1);
  const iteration = new Array(graph.length).fill(0);

  const buildLevelGraph = () => {
    level.fill(-1);
    level[source] = 0;
    const queue = [source];
    let cursor = 0;
    while (cursor < queue.length) {
      const node = queue[cursor] ?? 0;
      cursor += 1;
      for (const edge of graph[node]) {
        if (edge.capacity <= 0) continue;
        if (level[edge.to] >= 0) continue;
        level[edge.to] = level[node] + 1;
        queue.push(edge.to);
      }
    }
    return level[sink] >= 0;
  };

  const sendFlow = (node: number, flow: number): number => {
    if (node === sink) return flow;

    for (
      let edgeIndex = iteration[node];
      edgeIndex < graph[node].length;
      edgeIndex += 1
    ) {
      iteration[node] = edgeIndex;
      const edge = graph[node][edgeIndex];
      if (edge == null || edge.capacity <= 0) continue;
      if (level[edge.to] <= level[node]) continue;

      const nextFlow = sendFlow(edge.to, Math.min(flow, edge.capacity));
      if (nextFlow <= 0) continue;

      edge.capacity -= nextFlow;
      const reverseEdge = graph[edge.to][edge.reverseEdgeIndex];
      if (reverseEdge != null) {
        reverseEdge.capacity += nextFlow;
      }
      return nextFlow;
    }

    iteration[node] = graph[node].length;
    return 0;
  };

  let maxFlow = 0;
  while (buildLevelGraph()) {
    iteration.fill(0);
    while (maxFlow < totalRequired) {
      const pushed = sendFlow(source, totalRequired - maxFlow);
      if (pushed <= 0) break;
      maxFlow += pushed;
    }
    if (maxFlow >= totalRequired) break;
  }

  return { totalRequired, maxAssignable: maxFlow };
};

export const canSatisfyPenetrationRequirements = (params: {
  requiredPenetrationByDisruptionKey: Record<string, number>;
  penetrationEffects: PenetrationEffect[];
}) => {
  const { totalRequired, maxAssignable } =
    resolveMaxAssignablePenetration(params);
  return maxAssignable >= totalRequired;
};
