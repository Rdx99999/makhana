import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-warm-cream">
      {/* Hero Section */}
      <div className="bg-heritage-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            About SVJ Enterprises
          </h1>
          <p className="text-xl md:text-2xl font-serif italic opacity-90">
            A visionary healthy lifestyle company since 2009
          </p>
        </div>
      </div>

      {/* Company Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-henna mb-6">
              Welcome to SVJ Enterprises Limited
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              SVJ Enterprises is a visionary healthy lifestyle company. Our vision is to provide the finest nature-based products that will help consumers adopt a healthier lifestyle. Your busy hectic life can easily make your health take a back seat.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              SVJ was established on 16th October 2009, with the establishment purpose of promoting selling, manufacturing, trading, and processing agricultural products. The company carries business in India and abroad for manufacturing, buying, supplying, importing, exporting and selling products like honey, food products, grains, and our premium makhana varieties.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg traditional-shadow">
            <h3 className="font-display text-2xl font-semibold text-henna mb-4">Company Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-terracotta">Date of Incorporation:</span>
                <span className="ml-2">16th October, 2009</span>
              </div>
              <div>
                <span className="font-semibold text-terracotta">Type of Company:</span>
                <span className="ml-2">Company Limited by shares</span>
              </div>
              <div>
                <span className="font-semibold text-terracotta">Registration Number:</span>
                <span className="ml-2">196514</span>
              </div>
              <div>
                <span className="font-semibold text-terracotta">CIN:</span>
                <span className="ml-2">U15400MH2009PTC196514</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board of Directors */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-henna text-center mb-12">
            Board of Directors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="traditional-shadow">
              <CardHeader>
                <CardTitle className="text-terracotta">Ms. Saanvi Chanorahas Kargutkar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Chairman & Managing Director</p>
              </CardContent>
            </Card>
            <Card className="traditional-shadow">
              <CardHeader>
                <CardTitle className="text-terracotta">Mr. Suresh Ramchandra Jha</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Chairman & Independent Director</p>
              </CardContent>
            </Card>
            <Card className="traditional-shadow">
              <CardHeader>
                <CardTitle className="text-terracotta">Mr. Satish Kumar Dogra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Member & Independent Director</p>
              </CardContent>
            </Card>
            <Card className="traditional-shadow">
              <CardHeader>
                <CardTitle className="text-terracotta">Mr. ZahurAlam Noor Alam Shaikh</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Member & Independent Director</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Key Personnel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-henna text-center mb-12">
          Key Personnel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="traditional-shadow">
            <CardHeader>
              <CardTitle className="text-terracotta">Ms. Monika Maheshwari</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Compliance Officer & Company Secretary</p>
            </CardContent>
          </Card>
          <Card className="traditional-shadow">
            <CardHeader>
              <CardTitle className="text-terracotta">Ms. Veena Suresh Jha</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Chief Financial Officer</p>
            </CardContent>
          </Card>
          <Card className="traditional-shadow text-center">
            <CardHeader>
              <CardTitle className="text-terracotta">Investor Grievance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">info@svjenterprises.co.in</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-henna text-center mb-12">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="traditional-shadow">
              <CardHeader>
                <CardTitle className="text-terracotta">Corporate Office</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Address:</span>
                  <p className="text-gray-600 mt-1">
                    02/A, Sonam Palace CHS, Old Golden Nest-1,<br />
                    Mira Bhaindar Road, Mira Road (East),<br />
                    Thane 401107
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Phone:</span>
                  <p className="text-gray-600">(033) 2812 1275</p>
                </div>
                <div>
                  <span className="font-semibold">Email:</span>
                  <p className="text-gray-600">info@svjenterprises.co.in</p>
                </div>
                <div>
                  <span className="font-semibold">Website:</span>
                  <p className="text-gray-600">
                    <a href="http://svjenterprises.co.in/" className="text-terracotta hover:underline">
                      svjenterprises.co.in
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="traditional-shadow">
              <CardHeader>
                <CardTitle className="text-terracotta">Registrar & Share Transfer Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Company:</span>
                  <p className="text-gray-600 mt-1">Bigshare Services Pvt. Ltd.</p>
                </div>
                <div>
                  <span className="font-semibold">Address:</span>
                  <p className="text-gray-600 mt-1">
                    Office No S6-2 6th Floor, Pinnacle Business Park<br />
                    Mahakali Caves Rd, next to Ahura Centre<br />
                    Andheri East, Mumbai- 400093, Maharashtra
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Phone:</span>
                  <p className="text-gray-600">022 – 62638200, Direct: 022 62638202</p>
                </div>
                <div>
                  <span className="font-semibold">Fax:</span>
                  <p className="text-gray-600">+91 22 62638299</p>
                </div>
                <div>
                  <span className="font-semibold">Mobile:</span>
                  <p className="text-gray-600">7045455370</p>
                </div>
                <div>
                  <span className="font-semibold">Email:</span>
                  <p className="text-gray-600">
                    <a href="mailto:admission@bigshareonline.com" className="text-terracotta hover:underline">
                      admission@bigshareonline.com
                    </a>
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Website:</span>
                  <p className="text-gray-600">
                    <a href="http://www.bigshareonline.com" className="text-terracotta hover:underline">
                      www.bigshareonline.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}