import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import CreatePostModal from "@/components/modals/create-post-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const CreatePostButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleOpenModal = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-40 md:hidden">
        <Button 
          className="bg-gradient-to-r from-primary to-secondary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
          onClick={handleOpenModal}
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>
      <CreatePostModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default CreatePostButton;
