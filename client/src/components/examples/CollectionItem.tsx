import { CollectionItem } from "../CollectionItem";

export default function CollectionItemExample() {
  return (
    <div className="w-64 p-4 bg-sidebar space-y-2">
      <CollectionItem
        name="Authentication"
        type="folder"
        hasChildren={true}
      >
        <CollectionItem
          name="Login"
          type="request"
          method="POST"
          onClick={() => console.log("Login clicked")}
        />
        <CollectionItem
          name="Get User Profile"
          type="request"
          method="GET"
          isActive={true}
          onClick={() => console.log("Profile clicked")}
        />
      </CollectionItem>
      <CollectionItem
        name="Users"
        type="folder"
        hasChildren={true}
      >
        <CollectionItem
          name="List Users"
          type="request"
          method="GET"
          onClick={() => console.log("List users clicked")}
        />
      </CollectionItem>
    </div>
  );
}
