import React from 'react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const SuccessPage = async({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: Id<'courses'> }>;
  searchParams: Promise<{ session_id: string }>;
}) => {
  const { courseId } = await params;
  const { session_id } = await searchParams;

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-green-700">
            Purchase Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-xl text-gray-600">
            Thank you for enrolling our course.Your journey to new skills and
            knowledge begins now!
          </p>

          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-500">
              Transaction Id: {session_id}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Link href={`/courses/${courseId}`}>
              <Button className="w-full sm:w-auto flex items-center justify-center">
                Go to Course
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" className="w-full sm:w-auto">
                Browse More Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;