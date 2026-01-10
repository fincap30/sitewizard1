import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Upload, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProductBulkImport({ websiteIntakeId, onImportSuccess }) {
  const [importStatus, setImportStatus] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        // Parse preview
        const previewData = lines.slice(1, 6).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, idx) => {
            obj[header.trim()] = values[idx]?.trim();
            return obj;
          }, {});
        });

        setPreview({ headers, data: previewData });
        toast.success('File preview ready. Click Import to process.');
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const importProductsMutation = useMutation({
    mutationFn: async () => {
      if (!preview) {
        toast.error('Please select and preview a file first');
        return;
      }

      // Process and import products
      const productsToCreate = preview.data.map(row => ({
        website_intake_id: websiteIntakeId,
        name: row['Product Name'] || '',
        description: row['Description'] || '',
        price: parseFloat(row['Price']) || 0,
        category: row['Category'] || 'Uncategorized',
        stock_quantity: parseInt(row['Stock']) || 0,
        seo_keywords: row['Keywords']?.split(';').map(k => k.trim()) || []
      }));

      // Filter out empty rows
      const validProducts = productsToCreate.filter(p => p.name);

      if (validProducts.length === 0) {
        toast.error('No valid products to import');
        return;
      }

      // Create products in database
      try {
        await base44.entities.Product?.bulkCreate?.(validProducts);
        return { count: validProducts.length };
      } catch (error) {
        console.log('Bulk creation not available, creating individually...');
        for (const product of validProducts) {
          try {
            await base44.entities.Product?.create?.(product);
          } catch (e) {
            console.error('Failed to create product:', e);
          }
        }
        return { count: validProducts.length };
      }
    },
    onSuccess: (result) => {
      setImportStatus('success');
      toast.success(`Imported ${result.count} products!`);
      if (onImportSuccess) onImportSuccess();
      setPreview(null);
    },
    onError: () => {
      toast.error('Failed to import products');
    }
  });

  const downloadTemplate = () => {
    const template = `Product Name,Description,Price,Category,Stock,Keywords
Example Product,High-quality example product,29.99,Electronics,100,quality;durable;bestseller
Luxury Item,Premium luxury product,199.99,Premium,50,luxury;exclusive;premium`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'products_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Template downloaded!');
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Import/Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Products</TabsTrigger>
            <TabsTrigger value="export">Export Template</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Alert className="bg-blue-900/10 border-blue-500/30">
              <AlertDescription className="text-blue-300 text-sm">
                Upload a CSV file with columns: Product Name, Description, Price, Category, Stock, Keywords
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button
                onClick={() => document.getElementById('csv-upload').click()}
                variant="outline"
                className="w-full border-slate-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select CSV File
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {preview && (
                <div className="space-y-3">
                  <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                    <p className="text-sm font-medium text-white mb-2">Preview (first 5 rows)</p>
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full">
                        <thead>
                          <tr className="border-b border-slate-600">
                            {preview.headers.map((h, i) => (
                              <th key={i} className="text-left p-2 text-slate-400 font-medium">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.data.map((row, i) => (
                            <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/20">
                              {preview.headers.map((header, j) => (
                                <td key={j} className="p-2 text-slate-300">
                                  {row[header] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Button
                    onClick={() => importProductsMutation.mutate()}
                    disabled={importProductsMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {importProductsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Import Products
                      </>
                    )}
                  </Button>
                </div>
              )}

              {importStatus === 'success' && (
                <Alert className="bg-green-900/10 border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    Products imported successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Alert className="bg-blue-900/10 border-blue-500/30">
              <AlertDescription className="text-blue-300 text-sm">
                Download the CSV template to get started with bulk imports
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 space-y-2">
                <p className="text-sm font-medium text-white">CSV Template Format:</p>
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                  <p>Product Name | Description | Price | Category | Stock | Keywords</p>
                  <p className="text-slate-500">e.g., Widget | High-quality widget | 29.99 | Electronics | 100 | quality;durable</p>
                </div>
              </div>

              <Button
                onClick={downloadTemplate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>

              <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-700">
                <p className="text-xs font-medium text-slate-300 mb-2">Column Descriptions:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• <strong>Product Name</strong> - Required. Name of the product</li>
                  <li>• <strong>Description</strong> - Optional. Product description</li>
                  <li>• <strong>Price</strong> - Required. Product price (numeric)</li>
                  <li>• <strong>Category</strong> - Optional. Product category</li>
                  <li>• <strong>Stock</strong> - Optional. Initial stock quantity</li>
                  <li>• <strong>Keywords</strong> - Optional. Semicolon-separated keywords for SEO</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}