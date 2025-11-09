import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CourseProgress } from '@/types';
import { enrollInCourse, updateCourseRating } from '@/lib/firestore';
import { Star, Clock, Trophy, UserCheck } from 'lucide-react';

interface CourseProgressCardProps {
  courseId: string;
  userId: string;
  progress?: CourseProgress;
  onEnroll: () => void;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  courseId,
  userId,
  progress,
  onEnroll,
}) => {
  const [rating, setRating] = useState(progress?.rating || 0);
  const [review, setReview] = useState(progress?.review || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingSubmit = async () => {
    if (!progress?.enrolled) return;
    setIsSubmitting(true);
    try {
      await updateCourseRating(userId, courseId, rating, review);
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Failed to update rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!progress?.enrolled) {
    return (
      <Card className="bg-game-surface p-6">
        <h2 className="text-lg font-bold text-game-highlight mb-4">Join This Course</h2>
        <p className="text-game-textDim mb-6">
          Enroll to track your progress and unlock achievements
        </p>
        <Button 
          variant="primary"
          className="w-full"
          onClick={onEnroll}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Enroll Now
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-game-surface p-6">
      <h2 className="text-lg font-bold text-game-highlight mb-4">Your Progress</h2>
      
      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-game-background rounded-lg p-4">
          <div className="flex items-center gap-2 text-game-accent2 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Completion</span>
          </div>
          <p className="text-xl font-bold">
            {progress.levelsCompleted} / {progress.totalLevels}
          </p>
        </div>
        
        <div className="bg-game-background rounded-lg p-4">
          <div className="flex items-center gap-2 text-game-accent1 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Started</span>
          </div>
          <p className="text-sm">
            {progress.startedAt?.toDate().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Course Rating */}
      {progress.completedAt && (
        <div className="border-t border-game-border pt-4">
          <h3 className="text-game-highlight font-semibold mb-4">Rate This Course</h3>
          
          {/* Star Rating */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${
                  star <= rating ? 'text-game-accent3' : 'text-game-border'
                }`}
              >
                <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>

          {/* Review */}
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this course..."
            className="w-full h-24 mb-4"
          />

          <Button
            variant="primary"
            className="w-full"
            onClick={handleRatingSubmit}
            disabled={isSubmitting || !rating}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      )}
    </Card>
  );
};