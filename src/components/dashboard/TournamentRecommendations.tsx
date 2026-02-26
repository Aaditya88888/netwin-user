import React from "react";
import { useTournamentRecommendations } from "@/hooks/useTournamentRecommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EnhancedTournamentCard from "../tournaments/EnhancedTournamentCard";
import { 
  Lightbulb, 
  Star,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TournamentRecommendations() {
  const { recommendations, loading } = useTournamentRecommendations();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No recommendations available</p>
            <p className="text-sm text-gray-500 mb-4">
              Play more tournaments to get personalized recommendations
            </p>
            <Button onClick={() => navigate('/tournaments')}>
              Browse All Tournaments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topRecommendation = recommendations[0];
  const otherRecommendations = recommendations.slice(1, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-400" />
            Recommended for You
          </h2>
          <p className="text-gray-400 mt-1">
            Personalized tournament suggestions based on your performance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/tournaments')}
          className="hidden sm:flex items-center gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Top Recommendation */}
      {topRecommendation && (
        <Card className="bg-dark-card border-gray-800 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-medium">Top Pick for You</span>
                <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                  {topRecommendation.score}% match
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {topRecommendation.reasons.slice(0, 2).map((reason, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4">
            <EnhancedTournamentCard 
              tournament={topRecommendation.tournament} 
              featured={true}
              showStats={true}
            />
          </div>
        </Card>
      )}

      {/* Other Recommendations */}
      {otherRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">More Recommendations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherRecommendations.map((rec) => (
              <div key={rec.tournament.id} className="relative">
                <EnhancedTournamentCard tournament={rec.tournament} />
                
                {/* Recommendation overlay */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-dark/90 text-white border-0 backdrop-blur-sm">
                    {rec.score}% match
                  </Badge>
                </div>
                
                {/* Reasons tooltip */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="bg-dark/90 backdrop-blur-sm rounded-lg p-2 border border-gray-700">
                    <div className="text-xs text-gray-300">
                      <span className="font-medium">Why recommended:</span>
                      <ul className="mt-1 space-y-0.5">
                        {rec.reasons.slice(0, 2).map((reason, reasonIndex) => (
                          <li key={reasonIndex} className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View All Button for Mobile */}
      <div className="sm:hidden">
        <Button 
          onClick={() => navigate('/tournaments')}
          className="w-full"
          variant="outline"
        >
          View All Tournaments
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
