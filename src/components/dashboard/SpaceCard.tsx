import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { Square, Users, Clock } from 'lucide-react';

interface SpaceCardProps {
  id: string;
  name: string;
  type: 'MESA' | 'BARRA' | 'DELIVERY' | 'RESERVA';
  capacity?: number;
  status: 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  currentOrder?: {
    id: string;
    items: number;
    time: string;
  };
  className?: string;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'LIBRE':
      return 'success';
    case 'OCUPADA':
      return 'destructive';
    case 'RESERVADA':
      return 'warning';
    case 'MANTENIMIENTO':
      return 'secondary';
    default:
      return 'default';
  }
};

export const SpaceCard: React.FC<SpaceCardProps> = ({
  id,
  name,
  type,
  capacity,
  status,
  currentOrder,
  className
}) => {
  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-200",
      status === 'OCUPADA' && "border-red-200 bg-red-50/50",
      status === 'RESERVADA' && "border-yellow-200 bg-yellow-50/50",
      status === 'MANTENIMIENTO' && "border-gray-200 bg-gray-50/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Square className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          </div>
          <Badge variant={getStatusVariant(status) as any}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">{type}</span>
          </div>
          
          {capacity && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Capacidad:</span>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span className="font-medium">{capacity} personas</span>
              </div>
            </div>
          )}

          {currentOrder && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Orden actual:</span>
                <span className="font-medium">#{currentOrder.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{currentOrder.items}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Tiempo:</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{currentOrder.time}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
