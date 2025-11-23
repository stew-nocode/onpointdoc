import type { ReactElement } from 'react';

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
};

const MIN_PERCENT_TO_SHOW = 0.05;
const RADIAN = Math.PI / 180;

/**
 * Rend un label de pourcentage au centre d'un segment de donut chart
 * 
 * @param props - Propriétés du label (position, rayon, pourcentage)
 * @returns Element text avec le pourcentage ou null
 */
export function renderPieLabel(props: PieLabelProps): ReactElement | null {
  if (!props.percent || props.percent < MIN_PERCENT_TO_SHOW) {
    return null;
  }

  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0
  } = props;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

