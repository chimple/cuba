import React from 'react';
// import { PieChart, Pie, Cell } from 'recharts';
import './ClassSummary.css'
interface ClassSummaryProps {
  
}

const data = [
    { name: 'Assignments', value: 67, color: '#8884d8' },
    { name: 'Students', value: 73, color: '#82ca9d' },
    { name: 'Avg. Score', value: 70, color: '#ffc658' },
    { name: 'Time Spent', value: 50, color: '#ff8042' }
  ];
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  
  const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

const ClassSummary: React.FC<ClassSummaryProps> = ({  }) => {
    return (
      <div className="summary-container">
        <div className="summary-header">Weekly Summary of your Class</div>
        <div className="chart-container">
          {/* <PieChart width={200} height={200}>
            <Pie
              data={data}
              cx={100}
              cy={100}
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart> */}
        </div>
        <div className="summary-details">
          <div className="summary-item">
            <span className="item-label">Assignments</span>
            <span className="item-value">10/15</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Students</span>
            <span className="item-value">22/30</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Avg. Score</span>
            <span className="item-value">70%</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Time Spent</span>
            <span className="item-value">30 Mins</span>
          </div>
        </div>
      </div>
    )
  }

export default ClassSummary;
