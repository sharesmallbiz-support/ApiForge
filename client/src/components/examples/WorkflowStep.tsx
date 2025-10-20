import { WorkflowStep } from "../WorkflowStep";

export default function WorkflowStepExample() {
  return (
    <div className="p-4 bg-background max-w-2xl space-y-2">
      <WorkflowStep
        stepNumber={1}
        name="Get Auth Token"
        method="POST"
        url="https://api.example.com/auth/login"
        onDelete={() => console.log("Delete step 1")}
        onAddStep={() => console.log("Add step after 1")}
      />
      <WorkflowStep
        stepNumber={2}
        name="Fetch User Data"
        method="GET"
        url="https://api.example.com/users/{{userId}}"
        onDelete={() => console.log("Delete step 2")}
        onAddStep={() => console.log("Add step after 2")}
      />
    </div>
  );
}
