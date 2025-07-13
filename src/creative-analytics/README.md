# Creative Portfolio Analytics Extension

A sophisticated analytics dashboard for creative professionals that demonstrates complex API aggregations and data analysis.

## Features

### 🎨 Creative Industry Focus
- **Project Analytics**: Track project duration, budget, and complexity by category
- **Skill Usage**: Monitor hours spent on different skills and proficiency levels
- **Performance Metrics**: Analyze efficiency scores and quality ratings over time
- **Revenue Analysis**: Track revenue by client type and project size
- **Client Satisfaction**: Monitor ratings and feedback across different project types

### 📊 Complex Aggregations
This extension showcases advanced API query patterns:

#### 1. **Multi-Level Filtering with Aggregation**
```javascript
// Average project duration by category, filtered by high-budget projects
aggregate[type]=avg&aggregate[on]=value->>'duration'&group_by=value->>'category'&filter[on]=value->>'budget'&filter[gt]=5000
```

#### 2. **Aggregate Filtering**
```javascript
// Sum hours by skill, then filter results > 100 hours
aggregate[type]=sum&aggregate[on]=value->>'hours'&group_by=value->>'skill_name'&aggregate_filter[gt]=100
```

#### 3. **Time-Based Aggregation with Complex Filtering**
```javascript
// Average efficiency by day, filtered by complex projects after 2024
aggregate[type]=avg&aggregate[on]=value->>'efficiency_score'&group_by=day&filter[after]=2024-01-01&filter[on]=value->>'project_complexity'&filter[gt]=3
```

#### 4. **Revenue Analysis with Multiple Conditions**
```javascript
// Sum revenue by client type, filtered for high-value projects
aggregate[type]=sum&aggregate[on]=value->>'amount'&group_by=value->>'client_type'&aggregate_filter[gt]=10000
```

#### 5. **Weighted Averages with Quality Filtering**
```javascript
// Average rating by project size, filtered for high satisfaction
aggregate[type]=avg&aggregate[on]=value->>'rating'&group_by=value->>'project_size'&filter[on]=value->>'rating'&filter[gt]=4
```

## Data Structure

### Project Data
```json
{
  "key": "project",
  "value": {
    "name": "Brand Identity Design",
    "category": "Branding",
    "duration": 15,
    "budget": 8000,
    "skills_used": ["Illustrator", "Photoshop"],
    "client_type": "Startup",
    "complexity": 4
  }
}
```

### Skill Usage Data
```json
{
  "key": "skill_usage",
  "value": {
    "skill_name": "UI/UX Design",
    "hours": 120,
    "project_name": "Mobile App",
    "proficiency_level": "Expert",
    "date_used": "2024-01-15"
  }
}
```

### Performance Data
```json
{
  "key": "performance",
  "value": {
    "efficiency_score": 85,
    "project_complexity": 4,
    "time_spent": 8,
    "quality_score": 9,
    "date": "2024-01-15"
  }
}
```

### Revenue Data
```json
{
  "key": "revenue",
  "value": {
    "amount": 15000,
    "client_type": "Enterprise",
    "project_name": "Brand Identity",
    "payment_method": "Bank Transfer",
    "date": "2024-01-15"
  }
}
```

### Client Satisfaction Data
```json
{
  "key": "client_satisfaction",
  "value": {
    "rating": 5,
    "project_size": "Large",
    "client_name": "Tech Corp",
    "feedback": "Excellent work!",
    "date": "2024-01-15"
  }
}
```

## API Usage Examples

### Store Project Data
```javascript
await fetch('/extension_data/creative-analytics', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      key: 'project',
      value: {
        name: 'Web Design Project',
        category: 'Web Design',
        duration: 20,
        budget: 12000,
        skills_used: ['React', 'Figma'],
        client_type: 'Enterprise',
        complexity: 5
      }
    }
  })
})
```

### Query Complex Analytics
```javascript
// Get average project duration by category for high-budget projects
const response = await fetch('/extension_data/creative-analytics?key=project&aggregate[type]=avg&aggregate[on]=value->>\'duration\'&group_by=value->>\'category\'&filter[on]=value->>\'budget\'&filter[gt]=5000&order[by]=value&order[dir]=DESC')
```

## Dashboard Features

### 📊 Overview Tab
- **Total Revenue**: Sum of all revenue data
- **Average Efficiency**: Mean of performance scores
- **Top Skill**: Most used skill by hours
- **Best Category**: Highest performing project category

### 🎯 Projects Tab
- Project analytics by category
- Average duration calculations
- Budget range filtering
- Sample data addition

### 🛠️ Skills Tab
- Skill usage analytics
- Hours tracking by skill
- Proficiency level monitoring
- Usage patterns

### 📈 Performance Tab
- Efficiency over time
- Quality score tracking
- Complexity analysis
- Performance trends

### 💰 Revenue Tab
- Revenue by client type
- High-value project tracking
- Payment method analysis
- Revenue trends

## Technical Implementation

### Complex Query Patterns
1. **Nested JSON Path Queries**: Accessing nested object properties
2. **Multi-Level Filtering**: Combining multiple filter conditions
3. **Aggregate Filtering**: Filtering on aggregation results
4. **Time-Based Grouping**: Grouping by date with filters
5. **Weighted Calculations**: Complex mathematical operations

### Data Visualization
- **Bar Charts**: For skill usage and project performance
- **Metric Cards**: For key performance indicators
- **Data Tables**: For detailed analytics
- **Responsive Design**: Mobile-friendly interface

### State Management
- **Reactive Data**: Vue 3 Composition API
- **Computed Properties**: For derived analytics
- **Event Handling**: Login state management
- **Error Handling**: Graceful error management

## Build and Deploy

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## API Integration

This extension demonstrates the full power of the Extension Data API with:
- **Complex aggregations** across multiple data types
- **Advanced filtering** with JSON path queries
- **Multi-level grouping** for detailed analytics
- **Real-time data** updates and visualization
- **Creative industry** specific metrics and KPIs

Perfect for creative professionals, agencies, and freelancers who need sophisticated analytics for their portfolio and business performance tracking. 