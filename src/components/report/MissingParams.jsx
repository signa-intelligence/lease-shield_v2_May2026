import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function MissingParams() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Missing Parameters</h2>
            <p className="mb-6 text-gray-600">Open with: /ReportFull?scanId=xxx&leaseId=yyy</p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => (window.location.href = '/UploadScan')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}