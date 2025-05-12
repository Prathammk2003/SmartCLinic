import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-4xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 mt-4 max-w-md mx-auto">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/appointments/book"
            className="inline-block ml-4 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </div>
      
      {/* Visual elements */}
      <div className="mt-12 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
        </svg>
      </div>
    </div>
  );
} 