# LnkZoo 🌌

LnkZoo is a modern, high-performance community platform designed for sharing, discussing, and discovering the best links on the web. Built with cutting-edge web technologies, it features a premium glassmorphism UI and a highly interactive, customizable particle physics engine.

## 🚀 Key Features

* **Advanced Discovery Engine**: Navigate the web through tags, community leaderboards, or spin the **Internet Roulette** for an automated, auto-playing slideshow of top-tier content.
* **Premium Interactive UI**: Experience a sleek dark-mode interface with glassmorphism, dynamic scaling, and a fully customizable "antigravity" background particle system that reacts to your cursor.
* **Robust Social Features**: Follow users, track streaks, and earn verification badges. Dive deep into infinite nested comment threads with real-time upvoting and downvoting.
* **Cloudinary Image Cropping**: Seamlessly upload and crop high-quality avatar and cover images directly from your profile, stored securely via Cloudinary.
* **Curated Topics Taxonomy**: 60 pre-defined topics organized under categories — every link must be assigned a topic, keeping the feed organised.
* **URL Shortener**: On-demand short links with tracking, auto-expire after 24 hours, rate-limited (10/min guests, 30/min users).
* **Admin Analytics Dashboard**: Sectioned dashboard with d3-based charts, global time-range selector (7D/30D/90D/All), gap-filled daily series, and empty-state handling.
* **Smart Search & Tag Graphing**: Find exactly what you're looking for with instantaneous search and explore dynamic relationships between content tags.
* **Authentication**: Secure JWT-based session management with support for Google OAuth and standard credential logins.

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, Custom HTML5 Canvas (Physics Engine)
* **Styling**: Vanilla CSS with modern variables and Glassmorphism techniques
* **Backend**: Next.js API Routes (Serverless)
* **Database**: PostgreSQL (Neon Serverless)
* **Image Management**: Cloudinary API & `react-easy-crop`
* **Authentication**: Custom JWT Session Management

## ⚙️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/lnkzoo.git
   cd lnkzoo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL=postgresql://user:password@host/db
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # Cloudinary Keys (For image uploads)
   CLOUDINARY_URL=cloudinary://key:secret@cloudname
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Initialize Database**:
   Run the provided schema in `database/init.sql` against your PostgreSQL database to set up the required tables.

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## 🎨 Customizing the Background Physics
You can customize the density, speed, repulsion, and visibility of the background particles in real-time. Simply click the **Settings icon** located in the bottom-left of the sidebar to access the advanced visual controls. These settings are saved locally to your device.
