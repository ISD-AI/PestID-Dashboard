# PestID Analytics Dashboard

A comprehensive web dashboard for monitoring and verifying AI-powered pest detection observations across Australia. This system helps environmental agencies, researchers, and field workers collaborate on pest identification and management.


![Dashboard Preview](https://github.com/user-attachments/assets/64838ed4-3313-4311-b997-0fb367f4cabd)

### Live Demo

The dashboard is currently deployed and accessible at:
- **Main URL**: [pestid.isd.ai](https://pestid.isd.ai)
- **Vercel Deployment**: [pestid-dashboard.vercel.app](https://pestid-dashboard.vercel.app)

## 🔍 Features

### Interactive Overview
- **Multi-view Pest Detection Display**: Grid and table views with advanced filtering
- **Geospatial Visualization**: Interactive map showing detection locations with custom filtering by date range and species
- **Time-based Analytics**: Charts showing detection trends over time
- **Verification Stats**: Real-time metrics on verification status

### Verification Queue System
- **Streamlined Verification Workflow**: Process detections with a specialized interface
- **Image Analysis Tools**: Compare input and prediction images
- **Species Suggestion**: AI-powered suggestions for correct species identification
- **Multi-factor Classification**: Categorize observations by various factors (real pest, Google-sourced, etc.)
- **Verification History**: Track changes to verification status

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Tailwind CSS, shadcn/ui
- **Data Visualization**: Recharts, Leaflet
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Clerk Auth
- **AI Integration**: Custom AI models for species detection

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- API Keys such as firebase, clerk

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pest-detection-dashboard.git
cd pest-detection-dashboard
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
CLERK_SECRET_KEY=your_clerk_secret_key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Build for production
```bash
npm run build
# or
yarn build
```

## 📊 Data Structure

### Detection Types
The dashboard works with several detection data models:
- `BaseDetection`: Core detection fields from Predictions collection
- `PaginatedDetection`: Extended detection data for grid/table views
- `MapDetection`: Specialized detection data for map visualization
- `Verification`: Verification status and metadata

### Firestore Collections
- `Predictions`: Core detection records
- `PredictionMetaData`: Extended metadata for detections
- `Verification`: Verification records
- `VerificationHistory`: History of verification changes

## 🔒 Authentication

The dashboard uses Clerk Authentication and only specific admin accounts can be signed in and invite to new users from clerk dashboard.

## 🖥️ Key Components

### Detection Overview
- Detection statistics and trends
- Interactive map visualization
- Recent detections list
- Filterable detection grid/table

### Verification Queue
- Visual comparison of detection images
- Species information display
- Verification form with validation
- Next-in-queue preview

## 🔄 API Routes

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/fbdetection/[id]` | GET | Fetch a specific detection by ID | `id`: Detection ID |
| `/api/fbdetection/ausGeographic` | GET | Get geographic coverage data | None |
| `/api/fbdetection/categories` | GET | Get category counts by month | `year`: Year (optional, defaults to current year) |
| `/api/fbdetection/chart` | GET | Get detection time series data for charts | None |
| `/api/fbdetection/detectedSpecies` | GET | Get list of all detected species | None |
| `/api/fbdetection/map` | GET | Get detection data for map visualization | `startDate`, `endDate`, `scientificName`, `status` (all optional) |
| `/api/fbdetection/paginated` | GET | Get paginated detection records | `limit`: Number of records (default: 10)<br>`lastDocId`: Last document ID for pagination<br>`status`: Filter by status |
| `/api/fbdetection/recentDet` | GET | Get recent detection records | `limit`: Number of records (default: 100) |
| `/api/fbdetection/veriStats` | GET | Get verification statistics | None |
| `/api/verification` | GET | Get verifications by status or history by predID | `predID`: Prediction ID<br>`status`: Verification status |
| `/api/verification` | POST | Create a new verification record | JSON body with verification data |
| `/api/verification` | PATCH | Update a verification | `id`: Verification ID<br>JSON body with updates |
| `/api/verificationHistory` | GET | Fetch verification history | `id`: Verification ID (optional)<br>`limit`: Number of records<br>`lastDocId`: Last document ID for pagination |
| `/api/verificationHistory` | PATCH | Update a verification and create history record | `id`: Verification ID<br>JSON body with updates |
| `/api/get-bioclip-suggestions` | POST | Get AI-powered species suggestions | JSON body with `imageBlobBase64` |
| `/api/proxy-image` | GET | Proxy an image to avoid CORS issues | `url`: Original image URL |
| `/api/analysis/model-testing` | POST | Test detection models on an image | Form data with `image` file |

## 🚢 Deployment

The dashboard is deployed using Vercel's platform for Next.js applications:

### CI/CD Pipeline
- Automatic deployments on main branch changes
- Preview deployments on stg branch
- Environment variable management through github secrets

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Thomas Htut](https://www.linkedin.com/in/zay-ye-htut/) - Senior Full Stack Developer
- [Brian Aung](https://www.linkedin.com/in/brian-aung-ab347017b/) - Full Stack Developer

---

Built with ❤️ for Australian pest management
