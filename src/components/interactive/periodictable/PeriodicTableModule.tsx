import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Atom, Brain } from "lucide-react";
import PeriodicTableViewer from "./PeriodicTableViewer";
import PeriodicTableQuiz from "./PeriodicTableQuiz";

export default function PeriodicTableModule() {
  return (
    <Tabs defaultValue="table" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
        <TabsTrigger value="table" className="gap-2">
          <Atom className="h-4 w-4" /> Tableau Interactif
        </TabsTrigger>
        <TabsTrigger value="quiz" className="gap-2">
          <Brain className="h-4 w-4" /> Quiz Médical
        </TabsTrigger>
      </TabsList>
      <TabsContent value="table" className="mt-4">
        <PeriodicTableViewer />
      </TabsContent>
      <TabsContent value="quiz" className="mt-4">
        <PeriodicTableQuiz />
      </TabsContent>
    </Tabs>
  );
}
