# CWE Dependency Graph

A modern, interactive visualization tool for exploring Common Weakness Enumeration (CWE) relationships. This application helps security professionals, developers, and researchers understand the connections between different CWEs through an intuitive graph interface.

<img width="1481" alt="Screenshot 2025-02-03 at 18 17 00" src="https://github.com/user-attachments/assets/141d0afa-0e36-40a2-9c87-be4b7a3a696e" />



## Features

- 🔍 **Quick CWE Search**: Instantly search and visualize any CWE by its ID
- 📊 **Interactive Graph**: Drag, zoom, and explore the relationship network
- 🎨 **Semantic Layout**: 
  - Main CWE centered
  - Child relationships displayed below
  - Parent relationships positioned above
  - Peer relationships on the right
  - Other relationships on the left
- 🎯 **Clear Relationship Types**:
  - Color-coded nodes and edges
  - Animated connections
  - Hover effects for better visibility
- 📱 **Responsive Design**: Works seamlessly on desktop and tablet devices
- 🚀 **Real-time Updates**: Instant graph updates when searching new CWEs

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Graph Visualization**: React Flow
- **Icons**: Lucide React
- **Database**: Supabase
- **Build Tool**: Vite

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cwe-dependency-graph.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses two main tables in Supabase:

### CWE Table
- `id`: string (Primary Key)
- `name`: string

### CWE Relations Table
- `id`: number (Primary Key)
- `cwe_id`: string (Foreign Key)
- `related_cwe`: string (Foreign Key)
- `relation_type`: string

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Common Weakness Enumeration](https://cwe.mitre.org/) for providing the CWE database
- [React Flow](https://reactflow.dev/) for the excellent graph visualization library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Supabase](https://supabase.com/) for the backend infrastructure
